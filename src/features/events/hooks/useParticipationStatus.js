import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import EventParticipationService from '../services/eventParticipationService';
import {
  determineParticipationStatus,
  validateParticipationEligibility,
  validateCancellationEligibility
} from '../../../shared/utils/participationValidation';
import { 
  processParticipationError, 
  formatErrorForUser,
  createFallbackMessage 
} from '../../../shared/utils/participationErrorHandler';

// cache global para status de participação
const participationCache = new Map();
const CACHE_DURATION = 30000; // 30 segundos

// helper para gerenciar cache
const cacheHelpers = {
  get: (key) => {
    const cached = participationCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },
  
  set: (key, data) => {
    participationCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  delete: (key) => {
    participationCache.delete(key);
  },
  
  clear: () => {
    participationCache.clear();
  },
  
  // limpar entradas expiradas
  cleanup: () => {
    const now = Date.now();
    for (const [key, value] of participationCache.entries()) {
      if (now - value.timestamp >= CACHE_DURATION) {
        participationCache.delete(key);
      }
    }
  }
};

// debounce helper
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// hook para verificar status de participação em múltiplos eventos
export const useParticipationStatus = (eventIds = [], options = {}) => {
  const {
    enableCache = true,
    debounceDelay = 300,
    batchSize = 5,
    autoLoad = true,
    onStatusChange = null,
    enablePolling = false,
    pollingInterval = 60000 // 1 minuto para bulk operations
  } = options;

  const { user, isAuthenticated } = useAuth();

  // estado do hook
  const [state, setState] = useState({
    statusMap: new Map(),
    isLoading: false,
    error: null,
    lastUpdated: null,
    loadingEvents: new Set() // eventos sendo carregados individualmente
  });

  // refs para controle
  const mountedRef = useRef(true);
  const pollingRef = useRef(null);
  const loadingRef = useRef(false);

  // normalizar eventIds para array
  const normalizedEventIds = useMemo(() => {
    if (!Array.isArray(eventIds)) {
      return eventIds ? [eventIds] : [];
    }
    return eventIds.filter(id => id && typeof id === 'string');
  }, [eventIds]);

  // função para atualizar estado de forma segura
  const updateState = useCallback((updates) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // função para carregar status de um evento específico
  const loadSingleEventStatus = useCallback(async (eventId, useCache = true) => {
    if (!eventId || !isAuthenticated || !user) {
      return null;
    }

    // verificar cache primeiro
    if (useCache && enableCache) {
      const cacheKey = `${eventId}-${user.id}`;
      const cached = cacheHelpers.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await EventParticipationService.getParticipationStatus(eventId, user.id);
      
      if (result.success) {
        const statusData = {
          eventId,
          isRegistered: result.data.isRegistered,
          participantsCount: result.data.participantsCount,
          canRegister: result.data.canRegister,
          lastUpdated: result.data.lastUpdated
        };

        // salvar no cache
        if (enableCache) {
          const cacheKey = `${eventId}-${user.id}`;
          cacheHelpers.set(cacheKey, statusData);
        }

        return statusData;
      }
    } catch (error) {
      console.error(`Erro ao carregar status do evento ${eventId}:`, error);
    }

    // retornar status padrão em caso de erro
    return {
      eventId,
      isRegistered: false,
      participantsCount: 0,
      canRegister: false,
      lastUpdated: new Date().toISOString()
    };
  }, [isAuthenticated, user, enableCache]);

  // função para carregar status em lote
  const loadBulkStatus = useCallback(async (eventIdsToLoad, showLoading = true) => {
    if (!eventIdsToLoad.length || !isAuthenticated || !user || loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      
      if (showLoading) {
        updateState({ isLoading: true, error: null });
      }

      // verificar cache primeiro para reduzir requisições
      const uncachedEventIds = [];
      const cachedResults = new Map();

      if (enableCache) {
        eventIdsToLoad.forEach(eventId => {
          const cacheKey = `${eventId}-${user.id}`;
          const cached = cacheHelpers.get(cacheKey);
          if (cached) {
            cachedResults.set(eventId, cached);
          } else {
            uncachedEventIds.push(eventId);
          }
        });
      } else {
        uncachedEventIds.push(...eventIdsToLoad);
      }

      // usar o método bulk do service para eventos não cacheados
      let bulkResults = new Map();
      if (uncachedEventIds.length > 0) {
        const result = await EventParticipationService.getBulkParticipationStatus(uncachedEventIds, user.id);
        
        if (result.success) {
          bulkResults = result.data;
          
          // salvar resultados no cache
          if (enableCache) {
            bulkResults.forEach((statusData, eventId) => {
              const cacheKey = `${eventId}-${user.id}`;
              cacheHelpers.set(cacheKey, statusData);
            });
          }
        }
      }

      // combinar resultados cacheados e novos
      const finalResults = new Map([...cachedResults, ...bulkResults]);

      if (mountedRef.current) {
        updateState(prev => ({
          statusMap: new Map([...prev.statusMap, ...finalResults]),
          isLoading: false,
          error: null,
          lastUpdated: new Date().toISOString()
        }));

        // chamar callback se fornecido
        if (onStatusChange) {
          onStatusChange(finalResults);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status em lote:', error);
      
      // processar erro com novo sistema
      const structuredError = processParticipationError(error, 'statusCheck', {
        eventIds: eventIdsToLoad.length,
        userId: user.id,
        operation: 'loadBulkStatus'
      });
      
      const userError = formatErrorForUser(structuredError);
      
      if (mountedRef.current) {
        updateState({
          error: userError.message,
          isLoading: false
        });
      }
    } finally {
      loadingRef.current = false;
    }
  }, [isAuthenticated, user, enableCache, updateState, onStatusChange]);

  // função debounced para carregar status
  const debouncedLoadBulkStatus = useMemo(
    () => debounce(loadBulkStatus, debounceDelay),
    [loadBulkStatus, debounceDelay]
  );

  // função para refresh de todos os eventos
  const refreshAll = useCallback(async () => {
    if (normalizedEventIds.length === 0) return;

    // limpar cache para forçar reload
    if (enableCache) {
      normalizedEventIds.forEach(eventId => {
        const cacheKey = `${eventId}-${user?.id}`;
        cacheHelpers.delete(cacheKey);
      });
    }

    await loadBulkStatus(normalizedEventIds, true);
  }, [normalizedEventIds, enableCache, user, loadBulkStatus]);

  // função para refresh de um evento específico
  const refreshEvent = useCallback(async (eventId) => {
    if (!eventId || !isAuthenticated || !user) return;

    // marcar evento como carregando
    updateState(prev => ({
      loadingEvents: new Set([...prev.loadingEvents, eventId])
    }));

    try {
      // limpar cache para este evento
      if (enableCache) {
        const cacheKey = `${eventId}-${user.id}`;
        cacheHelpers.delete(cacheKey);
      }

      const statusData = await loadSingleEventStatus(eventId, false);
      
      if (statusData && mountedRef.current) {
        updateState(prev => ({
          statusMap: new Map([...prev.statusMap, [eventId, statusData]]),
          loadingEvents: new Set([...prev.loadingEvents].filter(id => id !== eventId)),
          lastUpdated: new Date().toISOString()
        }));

        // chamar callback se fornecido
        if (onStatusChange) {
          onStatusChange(new Map([[eventId, statusData]]));
        }
      }
    } catch (error) {
      console.error(`Erro ao refresh do evento ${eventId}:`, error);
    } finally {
      if (mountedRef.current) {
        updateState(prev => ({
          loadingEvents: new Set([...prev.loadingEvents].filter(id => id !== eventId))
        }));
      }
    }
  }, [isAuthenticated, user, enableCache, loadSingleEventStatus, updateState, onStatusChange]);

  // helpers para acessar dados
  const getStatus = useCallback((eventId) => {
    return state.statusMap.get(eventId) || {
      eventId,
      isRegistered: false,
      participantsCount: 0,
      canRegister: false,
      lastUpdated: null
    };
  }, [state.statusMap]);

  const isRegistered = useCallback((eventId) => {
    const status = getStatus(eventId);
    return status.isRegistered;
  }, [getStatus]);

  const canRegister = useCallback((eventId) => {
    const status = getStatus(eventId);
    return status.canRegister && isAuthenticated && user;
  }, [getStatus, isAuthenticated, user]);

  const getParticipantsCount = useCallback((eventId) => {
    const status = getStatus(eventId);
    return status.participantsCount;
  }, [getStatus]);

  const isEventLoading = useCallback((eventId) => {
    return state.loadingEvents.has(eventId);
  }, [state.loadingEvents]);

  // função para invalidar cache de eventos específicos
  const invalidateCache = useCallback((eventIdsToInvalidate = []) => {
    if (!enableCache || !user) return;

    const idsToInvalidate = eventIdsToInvalidate.length > 0 
      ? eventIdsToInvalidate 
      : normalizedEventIds;

    idsToInvalidate.forEach(eventId => {
      const cacheKey = `${eventId}-${user.id}`;
      cacheHelpers.delete(cacheKey);
    });
  }, [enableCache, user, normalizedEventIds]);

  // função para atualizar status local (otimistic updates)
  const updateLocalStatus = useCallback((eventId, updates) => {
    if (!eventId) return;

    updateState(prev => {
      const currentStatus = prev.statusMap.get(eventId) || {
        eventId,
        isRegistered: false,
        participantsCount: 0,
        canRegister: false,
        lastUpdated: new Date().toISOString()
      };

      const updatedStatus = {
        ...currentStatus,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      const newStatusMap = new Map(prev.statusMap);
      newStatusMap.set(eventId, updatedStatus);

      return {
        statusMap: newStatusMap,
        lastUpdated: new Date().toISOString()
      };
    });

    // invalidar cache para este evento
    if (enableCache && user) {
      const cacheKey = `${eventId}-${user.id}`;
      cacheHelpers.delete(cacheKey);
    }
  }, [updateState, enableCache, user]);

  // configurar polling se habilitado
  useEffect(() => {
    if (enablePolling && normalizedEventIds.length > 0 && isAuthenticated && pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        // fazer polling silencioso (sem loading)
        loadBulkStatus(normalizedEventIds, false);
      }, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [enablePolling, normalizedEventIds, isAuthenticated, pollingInterval, loadBulkStatus]);

  // carregar dados quando eventIds mudam
  useEffect(() => {
    if (autoLoad && normalizedEventIds.length > 0 && isAuthenticated && user) {
      debouncedLoadBulkStatus(normalizedEventIds, true);
    }
  }, [autoLoad, normalizedEventIds, isAuthenticated, user, debouncedLoadBulkStatus]);

  // cleanup periódico do cache
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cacheHelpers.cleanup();
    }, CACHE_DURATION);

    return () => clearInterval(cleanupInterval);
  }, []);

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
  const hasData = state.statusMap.size > 0;
  const isAnyEventLoading = state.loadingEvents.size > 0;
  const totalEvents = normalizedEventIds.length;
  const loadedEvents = normalizedEventIds.filter(id => state.statusMap.has(id)).length;
  const loadingProgress = totalEvents > 0 ? (loadedEvents / totalEvents) * 100 : 0;

  return {
    // estado principal
    statusMap: state.statusMap,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    loadingEvents: state.loadingEvents,

    // ações
    refreshAll,
    refreshEvent,
    invalidateCache,
    updateLocalStatus,

    // helpers para acessar dados
    getStatus,
    isRegistered,
    canRegister,
    getParticipantsCount,
    isEventLoading,

    // propriedades computadas
    hasData,
    isAnyEventLoading,
    totalEvents,
    loadedEvents,
    loadingProgress,

    // helpers para UI
    getRegisteredEvents: () => {
      return normalizedEventIds.filter(eventId => isRegistered(eventId));
    },

    getAvailableEvents: () => {
      return normalizedEventIds.filter(eventId => canRegister(eventId));
    },

    getEventsByStatus: (status) => {
      return normalizedEventIds.filter(eventId => {
        const eventStatus = getStatus(eventId);
        if (status === 'registered') return eventStatus.isRegistered;
        if (status === 'available') return eventStatus.canRegister;
        return false;
      });
    },

    // estatísticas
    getStats: () => {
      const registered = normalizedEventIds.filter(id => isRegistered(id)).length;
      const available = normalizedEventIds.filter(id => canRegister(id)).length;
      
      return {
        total: totalEvents,
        loaded: loadedEvents,
        registered,
        available,
        loadingProgress
      };
    }
  };
};

export default useParticipationStatus;