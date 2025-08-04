import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/context/AuthContext';
import { useParticipationToast } from './useParticipationToast';
import EventParticipationService from '../services/eventParticipationService';
import {
  validateParticipationEligibility,
  validateCancellationEligibility,
  determineParticipationStatus,
  getFriendlyIneligibilityMessage
} from '../utils/participationValidation';
import { 
  processParticipationError, 
  formatErrorForUser,
  createFallbackMessage 
} from '../utils/participationErrorHandler';

// mensagens de toast para diferentes cenários
const TOAST_MESSAGES = {
  REGISTRATION_SUCCESS: 'Inscrição realizada com sucesso!',
  REGISTRATION_ERROR: 'Erro ao se inscrever. Tente novamente.',
  CANCELLATION_SUCCESS: 'Inscrição cancelada com sucesso!',
  CANCELLATION_ERROR: 'Erro ao cancelar inscrição. Tente novamente.',
  EVENT_FULL: 'Este evento está lotado.',
  EVENT_CLOSED: 'As inscrições para este evento foram encerradas.',
  ALREADY_REGISTERED: 'Você já está inscrito neste evento.',
  NOT_REGISTERED: 'Você não está inscrito neste evento.',
  EVENT_STARTED: 'Não é possível cancelar após o início do evento.',
  NETWORK_ERROR: 'Problema de conexão. Verificando...',
  PERMISSION_ERROR: 'Você não tem permissão para esta ação.',
  LOADING_ERROR: 'Erro ao carregar informações de participação.'
};

// hook para gerenciar participação em um evento específico
export const useEventParticipation = (eventId, eventData = null, options = {}) => {
  const {
    autoLoad = true,
    onStatusChange = null,
    enablePolling = false,
    pollingInterval = 30000 // 30 segundos
  } = options;

  const { user, isAuthenticated } = useAuth();
  const participationToast = useParticipationToast();

  // estado do hook
  const [state, setState] = useState({
    isRegistered: false,
    participantsCount: 0,
    maxParticipants: null,
    canRegister: false,
    isLoading: false,
    isInitialLoading: true, // separar loading inicial do loading de ações
    error: null,
    lastUpdated: null,
    registrationStatus: 'unknown' // 'unknown', 'available', 'registered', 'full', 'closed'
  });

  // refs para controle de polling e cleanup
  const pollingRef = useRef(null);
  const mountedRef = useRef(true);

  // função para determinar se pode se registrar
  const determineCanRegister = useCallback((isRegistered, participantsCount, maxParticipants, eventData = null) => {
    if (!isAuthenticated || !user) return false;
    if (isRegistered) return false;
    
    // verificar se evento está lotado
    if (maxParticipants && participantsCount >= maxParticipants) return false;
    
    // verificar se evento ainda está aberto para inscrições
    if (eventData) {
      const now = new Date();
      const eventStart = new Date(eventData.startDateTime);
      
      // não permitir inscrição se evento já começou
      if (eventStart <= now) return false;
      
      // verificar status do evento
      if (eventData.status !== 'APPROVED') return false;
    }
    
    return true;
  }, [isAuthenticated, user]);

  // função para determinar status de registro
  const determineRegistrationStatus = useCallback((isRegistered, canRegister, participantsCount, maxParticipants) => {
    if (isRegistered) return 'registered';
    if (!canRegister) {
      if (maxParticipants && participantsCount >= maxParticipants) return 'full';
      return 'closed';
    }
    return 'available';
  }, []);

  // função para atualizar estado de forma segura
  const updateState = useCallback((updates) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // função para carregar status de participação
  const loadParticipationStatus = useCallback(async (showLoading = true, isInitial = false) => {
    if (!eventId || !isAuthenticated || !user) {
      updateState({
        isRegistered: false,
        participantsCount: 0,
        canRegister: false,
        registrationStatus: 'unknown',
        error: null,
        isLoading: false,
        isInitialLoading: false
      });
      return;
    }

    try {
      if (showLoading) {
        if (isInitial) {
          updateState({ isInitialLoading: true, error: null });
        } else {
          updateState({ isLoading: true, error: null });
        }
      }

      const result = await EventParticipationService.getParticipationStatus(eventId, user.id);

      if (result.success && mountedRef.current) {
        const { isRegistered, participantsCount } = result.data;
        
        // usar nova lógica de validação se temos dados do evento
        let canRegister = false;
        let registrationStatus = 'unknown';
        
        if (eventData) {
          // usar validação completa com dados do evento
          const participationStatus = { isRegistered };
          const statusResult = determineParticipationStatus(eventData, user, participationStatus);
          
          canRegister = statusResult.canRegister;
          registrationStatus = statusResult.status;
        } else {
          // fallback para lógica simples sem dados do evento
          canRegister = determineCanRegister(isRegistered, participantsCount, null);
          registrationStatus = determineRegistrationStatus(isRegistered, canRegister, participantsCount, null);
        }

        const newState = {
          isRegistered,
          participantsCount,
          maxParticipants: eventData?.maxParticipants || null,
          canRegister,
          registrationStatus,
          lastUpdated: new Date().toISOString(),
          error: null,
          isLoading: false,
          isInitialLoading: false
        };

        updateState(newState);

        // chamar callback se fornecido
        if (onStatusChange) {
          onStatusChange(newState);
        }
      } else if (mountedRef.current) {
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha ao carregar status'), 
          'statusCheck',
          { eventId, userId: user.id }
        );
        
        const userError = formatErrorForUser(structuredError);
        
        updateState({
          error: userError.message,
          isLoading: false,
          isInitialLoading: false
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Erro ao carregar status de participação:', error);
        
        // processar erro com novo sistema
        const structuredError = processParticipationError(error, 'statusCheck', {
          eventId,
          userId: user.id,
          operation: 'loadParticipationStatus'
        });
        
        const userError = formatErrorForUser(structuredError);
        
        updateState({
          error: userError.message,
          isLoading: false,
          isInitialLoading: false
        });
      }
    }
  }, [eventId, isAuthenticated, user, eventData, determineCanRegister, determineRegistrationStatus, updateState, onStatusChange]);

  // função para se registrar no evento
  const register = useCallback(async () => {
    if (!eventId || !isAuthenticated || !user || state.isLoading) {
      return { success: false, message: 'Operação não permitida' };
    }

    // validação prévia usando nova lógica de validação
    if (eventData) {
      const participationStatus = { isRegistered: state.isRegistered };
      const validation = validateParticipationEligibility(eventData, user, participationStatus);
      
      if (!validation.canParticipate) {
        const friendlyMessage = getFriendlyIneligibilityMessage(validation.reason);
        
        // mostrar toast apropriado baseado na razão
        switch (validation.reason) {
          case 'ALREADY_REGISTERED':
            participationToast.showAlreadyRegistered();
            break;
          case 'EVENT_FULL':
            participationToast.showEventFull();
            break;
          case 'REGISTRATION_CLOSED':
          case 'EVENT_PAST_START_TIME':
            participationToast.showEventClosed();
            break;
          default:
            participationToast.showRegistrationError(friendlyMessage);
        }
        
        return { success: false, message: friendlyMessage };
      }
    } else {
      // fallback para validação simples
      if (state.isRegistered) {
        participationToast.showAlreadyRegistered();
        return { success: false, message: TOAST_MESSAGES.ALREADY_REGISTERED };
      }

      if (!state.canRegister) {
        if (state.registrationStatus === 'full') {
          participationToast.showEventFull();
          return { success: false, message: TOAST_MESSAGES.EVENT_FULL };
        } else {
          participationToast.showEventClosed();
          return { success: false, message: TOAST_MESSAGES.EVENT_CLOSED };
        }
      }
    }

    try {
      updateState({ isLoading: true, error: null });

      const result = await EventParticipationService.registerForEvent(eventId);

      if (result.success && mountedRef.current) {
        // atualizar estado local imediatamente para feedback rápido
        const newParticipantsCount = state.participantsCount + 1;
        
        // usar nova lógica de validação se temos dados do evento
        let canRegister = false;
        let registrationStatus = 'registered';
        
        if (eventData) {
          const participationStatus = { isRegistered: true };
          const statusResult = determineParticipationStatus(eventData, user, participationStatus);
          canRegister = statusResult.canRegister;
          registrationStatus = statusResult.status;
        } else {
          // fallback para lógica simples
          canRegister = determineCanRegister(true, newParticipantsCount, state.maxParticipants);
          registrationStatus = determineRegistrationStatus(true, canRegister, newParticipantsCount, state.maxParticipants);
        }

        const newState = {
          isRegistered: true,
          participantsCount: newParticipantsCount,
          canRegister,
          registrationStatus,
          lastUpdated: new Date().toISOString(),
          error: null,
          isLoading: false
        };

        updateState(newState);

        // mostrar toast de sucesso
        participationToast.showRegistrationSuccess();

        // chamar callback se fornecido
        if (onStatusChange) {
          onStatusChange(newState);
        }

        // recarregar dados para sincronizar com servidor
        setTimeout(() => loadParticipationStatus(false), 1000);

        return { success: true, message: TOAST_MESSAGES.REGISTRATION_SUCCESS };
      } else if (mountedRef.current) {
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha na inscrição'), 
          'registration',
          { eventId, userId: user.id }
        );
        
        const userError = formatErrorForUser(structuredError);
        
        // mostrar toast baseado no tipo de erro
        if (structuredError.code === 'ALREADY_REGISTERED') {
          updateState({ isRegistered: true, registrationStatus: 'registered' });
          participationToast.showAlreadyRegistered();
        } else if (structuredError.code === 'EVENT_FULL') {
          updateState({ canRegister: false, registrationStatus: 'full' });
          participationToast.showEventFull();
        } else if (structuredError.category === 'NETWORK_ERROR') {
          participationToast.showNetworkError();
        } else if (structuredError.category === 'AUTHORIZATION_ERROR') {
          participationToast.showPermissionError();
        } else {
          participationToast.showRegistrationError(userError.message);
        }

        updateState({ error: userError.message, isLoading: false });

        return { success: false, message: userError.message };
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Erro ao se registrar no evento:', error);
        
        // processar erro com novo sistema
        const structuredError = processParticipationError(error, 'registration', {
          eventId,
          userId: user.id,
          operation: 'register'
        });
        
        const userError = formatErrorForUser(structuredError);
        
        updateState({ error: userError.message, isLoading: false });
        participationToast.showRegistrationError(userError.message);

        return { success: false, message: userError.message };
      }
    }

    return { success: false, message: TOAST_MESSAGES.REGISTRATION_ERROR };
  }, [eventId, isAuthenticated, user, state, eventData, determineCanRegister, determineRegistrationStatus, updateState, onStatusChange, participationToast, loadParticipationStatus]);

  // função para cancelar registro
  const cancelRegistration = useCallback(async () => {
    if (!eventId || !isAuthenticated || !user || state.isLoading) {
      return { success: false, message: 'Operação não permitida' };
    }

    // validação prévia usando nova lógica de validação
    if (eventData) {
      const participationStatus = { isRegistered: state.isRegistered };
      const validation = validateCancellationEligibility(eventData, user, participationStatus);
      
      if (!validation.canCancel) {
        const friendlyMessage = getFriendlyIneligibilityMessage(validation.reason);
        
        // mostrar toast apropriado baseado na razão
        switch (validation.reason) {
          case 'NOT_REGISTERED':
            participationToast.showNotRegistered();
            break;
          case 'EVENT_IN_PROGRESS':
          case 'EVENT_PAST_START_TIME':
            participationToast.showEventStarted();
            break;
          case 'EVENT_CONCLUDED':
            participationToast.showCancellationError('Evento já foi concluído');
            break;
          default:
            participationToast.showCancellationError(friendlyMessage);
        }
        
        return { success: false, message: friendlyMessage };
      }
    } else {
      // fallback para validação simples
      if (!state.isRegistered) {
        participationToast.showNotRegistered();
        return { success: false, message: TOAST_MESSAGES.NOT_REGISTERED };
      }
    }

    try {
      updateState({ isLoading: true, error: null });

      const result = await EventParticipationService.cancelRegistration(eventId);

      if (result.success && mountedRef.current) {
        // atualizar estado local imediatamente para feedback rápido
        const newParticipantsCount = Math.max(0, state.participantsCount - 1);
        
        // usar nova lógica de validação se temos dados do evento
        let canRegister = false;
        let registrationStatus = 'available';
        
        if (eventData) {
          const participationStatus = { isRegistered: false };
          const statusResult = determineParticipationStatus(eventData, user, participationStatus);
          canRegister = statusResult.canRegister;
          registrationStatus = statusResult.status;
        } else {
          // fallback para lógica simples
          canRegister = determineCanRegister(false, newParticipantsCount, state.maxParticipants);
          registrationStatus = determineRegistrationStatus(false, canRegister, newParticipantsCount, state.maxParticipants);
        }

        const newState = {
          isRegistered: false,
          participantsCount: newParticipantsCount,
          canRegister,
          registrationStatus,
          lastUpdated: new Date().toISOString(),
          error: null,
          isLoading: false
        };

        updateState(newState);

        // mostrar toast de sucesso
        participationToast.showCancellationSuccess();

        // chamar callback se fornecido
        if (onStatusChange) {
          onStatusChange(newState);
        }

        // recarregar dados para sincronizar com servidor
        setTimeout(() => loadParticipationStatus(false), 1000);

        return { success: true, message: TOAST_MESSAGES.CANCELLATION_SUCCESS };
      } else if (mountedRef.current) {
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha no cancelamento'), 
          'cancellation',
          { eventId, userId: user.id }
        );
        
        const userError = formatErrorForUser(structuredError);
        
        // mostrar toast baseado no tipo de erro
        if (structuredError.code === 'NOT_REGISTERED') {
          updateState({ isRegistered: false, registrationStatus: 'available' });
          participationToast.showNotRegistered();
        } else if (structuredError.code === 'EVENT_STARTED') {
          updateState({ canRegister: false, registrationStatus: 'closed' });
          participationToast.showEventStarted();
        } else if (structuredError.category === 'NETWORK_ERROR') {
          participationToast.showNetworkError();
        } else if (structuredError.category === 'AUTHORIZATION_ERROR') {
          participationToast.showPermissionError();
        } else {
          participationToast.showCancellationError(userError.message);
        }

        updateState({ error: userError.message, isLoading: false });

        return { success: false, message: userError.message };
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Erro ao cancelar registro:', error);
        
        // processar erro com novo sistema
        const structuredError = processParticipationError(error, 'cancellation', {
          eventId,
          userId: user.id,
          operation: 'cancelRegistration'
        });
        
        const userError = formatErrorForUser(structuredError);
        
        updateState({ error: userError.message, isLoading: false });
        participationToast.showCancellationError(userError.message);

        return { success: false, message: userError.message };
      }
    }

    return { success: false, message: TOAST_MESSAGES.CANCELLATION_ERROR };
  }, [eventId, isAuthenticated, user, state, eventData, determineCanRegister, determineRegistrationStatus, updateState, onStatusChange, participationToast, loadParticipationStatus]);

  // função para refresh manual
  const refresh = useCallback(() => {
    loadParticipationStatus(true);
  }, [loadParticipationStatus]);

  // função para toggle entre registrar/cancelar
  const toggleRegistration = useCallback(async () => {
    if (state.isRegistered) {
      return await cancelRegistration();
    } else {
      return await register();
    }
  }, [state.isRegistered, register, cancelRegistration]);

  // configurar polling se habilitado
  useEffect(() => {
    if (enablePolling && eventId && isAuthenticated && pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        loadParticipationStatus(false);
      }, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [enablePolling, eventId, isAuthenticated, pollingInterval, loadParticipationStatus]);

  // carregar dados na inicialização
  useEffect(() => {
    if (autoLoad && eventId && isAuthenticated) {
      loadParticipationStatus(true, true); // isInitial = true para carregamento inicial
    }
  }, [autoLoad, eventId, isAuthenticated, loadParticipationStatus]);

  // cleanup ao desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // propriedades computadas
  const isEventFull = state.maxParticipants && state.participantsCount >= state.maxParticipants;
  const canPerformActions = isAuthenticated && user && !state.isLoading;

  return {
    // estado
    isRegistered: state.isRegistered,
    participantsCount: state.participantsCount,
    maxParticipants: state.maxParticipants,
    canRegister: state.canRegister && canPerformActions,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    registrationStatus: state.registrationStatus,

    // ações
    register,
    cancelRegistration,
    refresh,
    toggleRegistration,

    // propriedades computadas
    isEventFull,
    canPerformActions,
    
    // helpers para UI
    getButtonText: () => {
      if (state.isLoading) return 'Carregando...';
      if (state.isRegistered) return 'Cancelar Inscrição';
      if (state.registrationStatus === 'full') return 'Lotado';
      if (state.registrationStatus === 'closed') return 'Encerrado';
      return 'Inscrever-se';
    },
    
    getButtonVariant: () => {
      if (state.isRegistered) return 'secondary';
      if (state.registrationStatus === 'full' || state.registrationStatus === 'closed') return 'disabled';
      return 'primary';
    },
    
    shouldShowParticipantsCount: () => {
      return state.participantsCount > 0 || state.maxParticipants;
    },
    
    getParticipantsText: () => {
      if (state.maxParticipants) {
        return `${state.participantsCount}/${state.maxParticipants} participantes`;
      }
      return `${state.participantsCount} participantes`;
    }
  };
};

export default useEventParticipation;