import React, { useCallback, useState } from 'react';
import { useFutureEvents } from '../../hooks/useEvents';
import { useParticipationStatus } from '../../hooks/useParticipationStatus';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../ui';
import { ToastContainer } from '../ui/Toast';
import EventCard from './EventCard';
import EventDetailsModal from './EventDetailsModal';

const EventsGrid = ({ 
  onEventAction,
  className = '',
  pageSize = 12,
  filters = {}
}) => {
  const { isAuthenticated } = useAuth();
  const {
    events,
    loading,
    error,
    loadMore,
    hasMore,
    isEmpty,
    refresh,
    participationLoading,
    statusMap
  } = useFutureEvents({ pageSize, filters });

  const { toasts, success, error: showError, removeToast } = useToast();
  
  // estado para modal de detalhes
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // extrair IDs dos eventos para monitoramento de participação
  const eventIds = events.map(event => event.id);

  // usar hook de participação adicional para atualizações em tempo real
  const {
    refreshEvent,
    updateLocalStatus,
    getStats
  } = useParticipationStatus(eventIds, {
    autoLoad: false, // não carregar automaticamente pois useFutureEvents já faz isso
    enableCache: true,
    onStatusChange: (updatedStatusMap) => {
      // notificar componente pai sobre mudanças de participação
      if (onEventAction) {
        updatedStatusMap.forEach((status, eventId) => {
          onEventAction(eventId, 'participationUpdated', status);
        });
      }
    }
  });

  const handleEventAction = useCallback(async (eventId, action, data) => {
    if (action === 'details') {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setIsModalOpen(true);
      }
    } else if (action === 'statusChanged' || action === 'participationChanged') {
      // quando status de participação muda, atualizar dados locais e notificar componente pai
      if (data && typeof data === 'object') {
        // atualizar status local para feedback imediato
        updateLocalStatus(eventId, {
          isRegistered: data.isRegistered,
          participantsCount: data.participantsCount,
          canRegister: data.canRegister
        });

        // refresh do evento específico para sincronizar com servidor
        setTimeout(() => {
          refreshEvent(eventId);
        }, 1000);
      }
    } else if (action === 'participationSuccess') {
      // mostrar feedback de sucesso
      success(data?.message || 'Operação realizada com sucesso!');
      
      // refresh do evento para dados atualizados
      refreshEvent(eventId);
    } else if (action === 'participationError') {
      // mostrar feedback de erro
      showError(data?.message || 'Erro na operação. Tente novamente.');
    }
    
    // chamar callback externo se fornecido
    if (onEventAction) {
      onEventAction(eventId, action, data);
    }
  }, [events, onEventAction, updateLocalStatus, refreshEvent, success, showError]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);



  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // skeleton para loading
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: pageSize }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // estado vazio
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg 
          className="w-12 h-12 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2m-8 0V7" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum evento encontrado
      </h3>
      <p className="text-gray-500 mb-4">
        Não há eventos futuros disponíveis no momento.
      </p>
      <button
        onClick={refresh}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        Atualizar
      </button>
    </div>
  );

  // estado de erro
  const renderErrorState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg 
          className="w-12 h-12 text-red-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Erro ao carregar eventos
      </h3>
      <p className="text-gray-500 mb-4">
        {error || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <button
        onClick={refresh}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );

  const renderEventCard = (event) => (
    <EventCard
      key={event.id}
      event={event}
      onViewDetails={(eventId) => handleEventAction(eventId, 'details')}
      onStatusChange={(status) => {
        // callback para quando status de participação muda
        // pode ser usado para atualizar estatísticas ou outros componentes
        if (onEventAction) {
          onEventAction(event.id, 'statusChanged', status);
        }
      }}
    />
  );

  if (loading && events.length === 0) {
    return (
      <div className={className}>
        {renderSkeleton()}
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className={className}>
        {renderErrorState()}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Grid de eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(renderEventCard)}
      </div>

      {/* Botão carregar mais */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Carregando...
              </>
            ) : (
              'Carregar mais eventos'
            )}
          </button>
        </div>
      )}

      {/* Indicador de loading para carregamento adicional */}
      {loading && events.length > 0 && (
        <div className="text-center mt-4">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {/* Modal de detalhes do evento */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default EventsGrid;