import React, { useState, useEffect, useCallback } from 'react';
import usePermissions from '../../auth/hooks/usePermissions';
import { EventService } from '../../services';
import EventParticipationService from '../../services/eventParticipationService';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../hooks/useToast';
import PendingEventCard from './PendingEventCard';
import RejectEventModal from './RejectEventModal';
import EventDetailsModal from './EventDetailsModal';
import { LoadingSpinner } from '../ui';
import { ToastContainer } from '../ui/Toast';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

/**
 * Seção de eventos pendentes de aprovação
 * Visível apenas para usuários com permissões de aprovação
 */
const PendingEventsSection = ({ onEventProcessed, className = '' }) => {
  const permissions = usePermissions();
  const { user, isAuthenticated } = useAuth();
  const { toasts, success, error, removeToast } = useToast();

  // estados principais
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [processingEvents, setProcessingEvents] = useState(new Set());
  
  // estado para contagens de participação
  const [participationCounts, setParticipationCounts] = useState(new Map());

  // estados dos modais
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // verificar se usuário tem permissão para ver eventos pendentes
  const canViewPendingEvents = permissions.canViewPendingEvents();

  // função para carregar contagens de participação para eventos aprovados
  const loadParticipationCounts = useCallback(async (eventIds) => {
    if (!eventIds.length || !isAuthenticated || !user) return;

    try {
      // carregar contagens em paralelo para todos os eventos
      const countPromises = eventIds.map(async (eventId) => {
        const result = await EventParticipationService.getParticipantsCount(eventId);
        return {
          eventId,
          count: result.success ? result.data.count : 0
        };
      });

      const results = await Promise.all(countPromises);
      
      // atualizar mapa de contagens
      const newCounts = new Map();
      results.forEach(({ eventId, count }) => {
        newCounts.set(eventId, count);
      });
      
      setParticipationCounts(newCounts);
    } catch (error) {
      console.error('Erro ao carregar contagens de participação:', error);
    }
  }, [isAuthenticated, user]);

  // função para carregar eventos pendentes
  const loadPendingEvents = useCallback(async () => {
    if (!canViewPendingEvents) return;

    try {
      setLoading(true);
      setLoadingError(null);

      const result = await EventService.getEventsByStatus('PENDING_APPROVAL');

      if (result.success) {
        const events = result.data || [];
        setPendingEvents(events);
        
        // carregar contagens de participação para eventos que já foram aprovados anteriormente
        // (útil para mostrar histórico de participação em eventos similares)
        const eventIds = events.map(event => event.id);
        if (eventIds.length > 0) {
          loadParticipationCounts(eventIds);
        }
      } else {
        const errorMessage = result.error?.message || 'Erro ao carregar eventos pendentes';
        setLoadingError(errorMessage);
        console.error('Erro ao carregar eventos pendentes:', result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro inesperado ao carregar eventos pendentes';
      setLoadingError(errorMessage);
      console.error('Erro ao carregar eventos pendentes:', err);
    } finally {
      setLoading(false);
    }
  }, [canViewPendingEvents, loadParticipationCounts]);

  // função para aprovar evento com otimização e rollback
  const handleApproveEvent = useCallback(async (eventId) => {
    if (!permissions.canApproveEvents()) {
      error('Você não tem permissão para aprovar eventos');
      return;
    }

    // encontrar o evento para possível rollback
    const eventToProcess = pendingEvents.find(event => event.id === eventId);
    if (!eventToProcess) {
      error('Evento não encontrado');
      return;
    }

    try {
      // adicionar evento ao conjunto de processamento
      setProcessingEvents(prev => new Set([...prev, eventId]));

      // atualização otimista - remover imediatamente da lista
      setPendingEvents(prev => prev.filter(event => event.id !== eventId));

      const result = await EventService.approveEvent(eventId);

      if (result.success) {
        // notificar componente pai sobre o processamento
        if (onEventProcessed) {
          onEventProcessed(eventId, 'approved');
        }

        success('Evento aprovado com sucesso!');
      } else {
        // rollback - adicionar evento de volta à lista
        setPendingEvents(prev => [eventToProcess, ...prev]);
        
        const errorMessage = result.error?.message || 'Erro ao aprovar evento';
        error(errorMessage);
        console.error('Erro ao aprovar evento:', result.error);
      }
    } catch (err) {
      // rollback - adicionar evento de volta à lista
      setPendingEvents(prev => [eventToProcess, ...prev]);
      
      const errorMessage = err.message || 'Erro inesperado ao aprovar evento';
      error(errorMessage);
      console.error('Erro ao aprovar evento:', err);
    } finally {
      // remover evento do conjunto de processamento
      setProcessingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  }, [permissions, pendingEvents, onEventProcessed, success, error]);

  // função para rejeitar evento
  const handleRejectEvent = useCallback(async (eventId, rejectionReason) => {
    if (!permissions.canRejectEvents()) {
      error('Você não tem permissão para rejeitar eventos');
      return;
    }

    try {
      // adicionar evento ao conjunto de processamento
      setProcessingEvents(prev => new Set([...prev, eventId]));

      const result = await EventService.rejectEvent(eventId, {
        rejectionReason: rejectionReason
      });

      if (result.success) {
        // remover evento da lista de pendentes
        setPendingEvents(prev => prev.filter(event => event.id !== eventId));
        
        // notificar componente pai sobre o processamento
        if (onEventProcessed) {
          onEventProcessed(eventId, 'rejected');
        }

        success('Evento rejeitado com sucesso!');
        
        // fechar modal de rejeição
        setShowRejectModal(false);
        setSelectedEvent(null);
      } else {
        const errorMessage = result.error?.message || 'Erro ao rejeitar evento';
        error(errorMessage);
        console.error('Erro ao rejeitar evento:', result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro inesperado ao rejeitar evento';
      error(errorMessage);
      console.error('Erro ao rejeitar evento:', err);
    } finally {
      // remover evento do conjunto de processamento
      setProcessingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  }, [permissions, onEventProcessed, success, error]);

  // handlers para ações dos cards
  const handleCardApprove = useCallback((eventId) => {
    handleApproveEvent(eventId);
  }, [handleApproveEvent]);

  const handleCardReject = useCallback((eventId) => {
    const event = pendingEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowRejectModal(true);
    }
  }, [pendingEvents]);

  const handleCardViewDetails = useCallback((event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  }, []);

  // handlers dos modais
  const handleRejectModalClose = useCallback(() => {
    setShowRejectModal(false);
    setSelectedEvent(null);
  }, []);

  const handleDetailsModalClose = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedEvent(null);
  }, []);

  const handleRejectModalSubmit = useCallback((rejectionReason) => {
    if (selectedEvent) {
      handleRejectEvent(selectedEvent.id, rejectionReason);
    }
  }, [selectedEvent, handleRejectEvent]);

  // carregar eventos na inicialização
  useEffect(() => {
    loadPendingEvents();
  }, [loadPendingEvents]);

  // não renderizar se usuário não tem permissão
  if (!canViewPendingEvents) {
    return null;
  }

  // componente de erro
  const ErrorDisplay = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erro ao carregar eventos pendentes
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {loadingError}
          </p>
        </div>
        <button
          onClick={loadPendingEvents}
          className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );

  // componente de estado vazio
  const EmptyState = () => (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum evento aguardando aprovação
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Todos os eventos foram processados. Novos eventos aparecerão aqui quando precisarem de aprovação.
      </p>
    </div>
  );

  // componente de loading
  const LoadingDisplay = () => (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-600">Carregando eventos pendentes...</span>
    </div>
  );

  return (
    <section 
      className={`${className}`}
      role="region" 
      aria-label="Eventos pendentes de aprovação"
      aria-live="polite"
    >
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="w-6 h-6 text-yellow-600 mr-3" />
          <div>
            <h2 
              id="pending-events-title" 
              className="text-2xl font-bold text-gray-900"
            >
              Eventos Pendentes
              {loading && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  <LoadingSpinner size="sm" className="mr-1" />
                  ...
                </span>
              )}
              {pendingEvents.length > 0 && !loading && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {pendingEvents.length}
                </span>
              )}
            </h2>
            <p className="text-gray-600 mt-1">
              Eventos aguardando aprovação para publicação
            </p>
          </div>
        </div>

        {/* Botão de refresh */}
        {!loading && (
          <button
            onClick={loadPendingEvents}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            aria-label="Atualizar lista de eventos pendentes"
          >
            Atualizar
          </button>
        )}
      </div>

      {/* Conteúdo da seção */}
      <div>
        {loading && <LoadingDisplay />}
        
        {loadingError && !loading && <ErrorDisplay />}
        
        {!loading && !loadingError && pendingEvents.length === 0 && <EmptyState />}
        
        {!loading && !loadingError && pendingEvents.length > 0 && (
          <div 
            role="list" 
            aria-labelledby="pending-events-title"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {pendingEvents.map(event => (
              <div key={event.id} role="listitem">
                <PendingEventCard
                  event={event}
                  onApprove={handleCardApprove}
                  onReject={handleCardReject}
                  onViewDetails={handleCardViewDetails}
                  isProcessing={processingEvents.has(event.id)}
                  participationCount={participationCounts.get(event.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de rejeição */}
      <RejectEventModal
        isOpen={showRejectModal}
        event={selectedEvent}
        onClose={handleRejectModalClose}
        onReject={handleRejectModalSubmit}
        isSubmitting={selectedEvent ? processingEvents.has(selectedEvent.id) : false}
      />

      {/* Modal de detalhes */}
      <EventDetailsModal
        isOpen={showDetailsModal}
        event={selectedEvent}
        onClose={handleDetailsModalClose}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </section>
  );
};

export default PendingEventsSection;