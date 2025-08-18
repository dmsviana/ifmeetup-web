import { useState, useEffect, useCallback } from 'react';
import { EventService, EventParticipationService } from '../../events/services';

// valores fallback para quando há erro
const fallbackStats = {
  activeEvents: 0,
  totalParticipants: 0,
  availableRooms: 0,
  ongoingEvents: 0
};

/**
 * Hook customizado para gerenciar estatísticas do dashboard
 * Implementa carregamento paralelo, retry logic e fallback values
 */
const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 3;
  const retryDelay = 1000; // 1 segundo

  /**
   * Função para carregar estatísticas com retry automático
   * Agora inclui contagens reais de participação da API
   */
  const loadStats = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // carregar estatísticas básicas do EventService
      const basicStatsResult = await EventService.getDashboardStats();

      if (basicStatsResult.success) {
        let enhancedStats = { ...basicStatsResult.data };

        // buscar eventos aprovados para calcular participação real
        const eventsResult = await EventService.getEventsByStatus('APPROVED');
        
        if (eventsResult.success && eventsResult.data.length > 0) {
          const approvedEvents = eventsResult.data;
          
          // carregar contagens reais de participação para eventos aprovados
          try {
            const participationPromises = approvedEvents.map(async (event) => {
              const countResult = await EventParticipationService.getParticipantsCount(event.id);
              return {
                eventId: event.id,
                count: countResult.success ? countResult.data.count : 0
              };
            });

            const participationResults = await Promise.all(participationPromises);
            
            // calcular total real de participantes
            const realTotalParticipants = participationResults.reduce((total, result) => {
              return total + result.count;
            }, 0);

            // atualizar estatísticas com dados reais
            enhancedStats.totalParticipants = realTotalParticipants;
            
            // também atualizar contagem de eventos ativos com base em eventos que têm participantes
            const eventsWithParticipants = participationResults.filter(result => result.count > 0).length;
            
            // usar a maior contagem entre eventos aprovados e eventos com participantes
            enhancedStats.activeEvents = Math.max(enhancedStats.activeEvents, eventsWithParticipants);
            
          } catch (participationError) {
            console.warn('Erro ao carregar dados de participação, usando dados básicos:', participationError);
            // continuar com dados básicos se houver erro na participação
          }
        }

        setStats(enhancedStats);
        setError(null);
        setRetryCount(0); // reset retry count on success
      } else {
        throw new Error(basicStatsResult.error?.message || 'Erro ao carregar estatísticas');
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas do dashboard:', err);
      
      // se ainda pode tentar novamente
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        
        // retry com delay exponencial
        setTimeout(() => {
          loadStats(true);
        }, retryDelay * Math.pow(2, retryCount));
      } else {
        // usar valores fallback após esgotar tentativas
        setStats(fallbackStats);
        setError({
          message: 'Não foi possível carregar as estatísticas',
          canRetry: true
        });
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  /**
   * Função para retry manual
   */
  const retry = useCallback(() => {
    setRetryCount(0);
    loadStats();
  }, [loadStats]);

  /**
   * Função para refresh das estatísticas
   */
  const refresh = useCallback(() => {
    setRetryCount(0);
    loadStats();
  }, [loadStats]);

  // carregar estatísticas na montagem do componente
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    retry,
    refresh,
    isRetrying: retryCount > 0 && retryCount < maxRetries
  };
};

export default useDashboardStats;