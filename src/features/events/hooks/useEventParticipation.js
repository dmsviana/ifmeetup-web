import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import EventParticipationService from '../services/eventParticipationService';
import { PARTICIPATION_TOAST_MESSAGES } from '../services/participationToastService';

export const useEventParticipation = (eventId, eventData = null) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState({
    isRegistered: false,
    participantsCount: 0,
    maxParticipants: eventData?.maxParticipants || null,
    canRegister: false,
    isLoading: false,
    error: null,
    lastUpdated: null,
    registrationStatus: 'unknown'
  });

  // função para atualizar estado de forma controlada
  const updateState = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  // verificar se pode realizar ações
  const canPerformActions = useCallback(() => {
    if (!isAuthenticated || !eventId || !eventData) return false;
    
    const eventDate = new Date(eventData.startDateTime);
    const now = new Date();
    const isEventInFuture = eventDate > now;
    const isEventApproved = eventData.status === 'APPROVED';
    
    return isEventInFuture && isEventApproved;
  }, [isAuthenticated, eventId, eventData]);

  // verificar se evento está lotado
  const isEventFull = useCallback(() => {
    if (!state.maxParticipants) return false;
    return state.participantsCount >= state.maxParticipants;
  }, [state.participantsCount, state.maxParticipants]);

  // carregar status de participação
  const loadParticipationStatus = useCallback(async () => {
    if (!isAuthenticated || !eventId || !user?.id) {
      updateState({
        isRegistered: false,
        canRegister: false,
        registrationStatus: 'not_authenticated'
      });
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      const [statusResult, countResult] = await Promise.all([
        EventParticipationService.checkRegistrationStatus(eventId, user.id),
        EventParticipationService.getParticipantsCount(eventId)
      ]);

      const isRegistered = statusResult.success ? statusResult.data.isRegistered : false;
      const participantsCount = countResult.success ? countResult.data.count : 0;
      const canRegister = !isRegistered && canPerformActions() && !isEventFull();

      updateState({
        isRegistered,
        participantsCount,
        canRegister,
        registrationStatus: isRegistered ? 'registered' : 'not_registered',
        error: null
      });

    } catch (error) {
      console.error('Erro ao carregar status de participação:', error);
      updateState({
        error: error.message || 'Erro ao carregar informações',
        registrationStatus: 'error'
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [isAuthenticated, eventId, user?.id, canPerformActions, isEventFull, updateState]);

  // inscrever no evento
  const register = useCallback(async () => {
    if (!canPerformActions() || state.isRegistered || isEventFull()) {
      return { 
        success: false, 
        message: 'Não é possível se inscrever neste evento' 
      };
    }

    try {
      updateState({ isLoading: true, error: null });

      const result = await EventParticipationService.registerForEvent(eventId);

      if (result.success) {
        updateState({
          isRegistered: true,
          participantsCount: state.participantsCount + 1,
          canRegister: false,
          registrationStatus: 'registered'
        });

        return {
          success: true,
          message: PARTICIPATION_TOAST_MESSAGES.REGISTRATION_SUCCESS,
          data: result.data
        };
      } else {
        const errorMessage = result.error?.userMessage || 
                            result.error?.message || 
                            PARTICIPATION_TOAST_MESSAGES.REGISTRATION_ERROR;
        
        updateState({ error: errorMessage });
        return { success: false, message: errorMessage };
      }

    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      const errorMessage = error.message || PARTICIPATION_TOAST_MESSAGES.REGISTRATION_ERROR;
      updateState({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      updateState({ isLoading: false });
    }
  }, [eventId, state.isRegistered, state.participantsCount, canPerformActions, isEventFull, updateState]);

  // cancelar inscrição
  const cancelRegistration = useCallback(async () => {
    if (!canPerformActions() || !state.isRegistered) {
      return { 
        success: false, 
        message: 'Não é possível cancelar esta inscrição' 
      };
    }

    try {
      updateState({ isLoading: true, error: null });

      const result = await EventParticipationService.cancelRegistration(eventId);

      if (result.success) {
        updateState({
          isRegistered: false,
          participantsCount: Math.max(0, state.participantsCount - 1),
          canRegister: canPerformActions() && !isEventFull(),
          registrationStatus: 'not_registered'
        });

        return {
          success: true,
          message: PARTICIPATION_TOAST_MESSAGES.CANCELLATION_SUCCESS,
          data: result.data
        };
      } else {
        const errorMessage = result.error?.userMessage || 
                            result.error?.message || 
                            PARTICIPATION_TOAST_MESSAGES.CANCELLATION_ERROR;
        
        updateState({ error: errorMessage });
        return { success: false, message: errorMessage };
      }

    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      const errorMessage = error.message || PARTICIPATION_TOAST_MESSAGES.CANCELLATION_ERROR;
      updateState({ error: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      updateState({ isLoading: false });
    }
  }, [eventId, state.isRegistered, state.participantsCount, canPerformActions, isEventFull, updateState]);

  // alternar inscrição (inscrever ou cancelar)
  const toggleRegistration = useCallback(async () => {
    if (state.isRegistered) {
      return await cancelRegistration();
    } else {
      return await register();
    }
  }, [state.isRegistered, register, cancelRegistration]);

  // recarregar dados
  const refresh = useCallback(() => {
    loadParticipationStatus();
  }, [loadParticipationStatus]);

  // texto do botão baseado no estado
  const getButtonText = useCallback(() => {
    if (state.isLoading) {
      return state.isRegistered ? 'Cancelando...' : 'Inscrevendo...';
    }
    
    if (!isAuthenticated) {
      return 'Fazer Login';
    }
    
    if (!canPerformActions()) {
      return 'Indisponível';
    }
    
    if (isEventFull() && !state.isRegistered) {
      return 'Evento Lotado';
    }
    
    return state.isRegistered ? 'Cancelar Inscrição' : 'Inscrever-se';
  }, [state.isLoading, state.isRegistered, isAuthenticated, canPerformActions, isEventFull]);

  // variante do botão
  const getButtonVariant = useCallback(() => {
    if (state.isLoading) return 'loading';
    if (!isAuthenticated) return 'secondary';
    if (!canPerformActions()) return 'disabled';
    if (isEventFull() && !state.isRegistered) return 'disabled';
    
    return state.isRegistered ? 'outline' : 'primary';
  }, [state.isLoading, state.isRegistered, isAuthenticated, canPerformActions, isEventFull]);

  // se deve mostrar contagem de participantes
  const shouldShowParticipantsCount = useCallback(() => {
    return state.maxParticipants > 0;
  }, [state.maxParticipants]);

  // texto da contagem de participantes
  const getParticipantsText = useCallback(() => {
    if (!shouldShowParticipantsCount()) {
      return `${state.participantsCount} participantes`;
    }
    
    return `${state.participantsCount}/${state.maxParticipants}`;
  }, [state.participantsCount, state.maxParticipants, shouldShowParticipantsCount]);

  // carregar dados na inicialização e quando eventId mudar
  useEffect(() => {
    if (eventId) {
      loadParticipationStatus();
    }
  }, [eventId, loadParticipationStatus]);

  // atualizar maxParticipants quando eventData mudar
  useEffect(() => {
    if (eventData?.maxParticipants !== state.maxParticipants) {
      updateState({ 
        maxParticipants: eventData?.maxParticipants || null 
      });
    }
  }, [eventData?.maxParticipants, state.maxParticipants, updateState]);

  return {
    // estado
    ...state,
    isEventFull: isEventFull(),
    canPerformActions: canPerformActions(),
    
    // ações
    register,
    cancelRegistration,
    toggleRegistration,
    refresh,
    
    // helpers de UI
    getButtonText,
    getButtonVariant,
    shouldShowParticipantsCount,
    getParticipantsText
  };
};

export default useEventParticipation;