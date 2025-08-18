import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ErrorBoundary } from '../../../shared/components/ui';
import { useAuth } from '../../auth/context/AuthContext';

import { useToast } from '../../../shared/hooks';
import { EventService, EventParticipationService } from '../../events/services';
import EventActionButtons from './EventActionButtons';
import EditEventModal from './EditEventModal';
import { 
  SmartParticipationFallback,
  NetworkErrorFallback,
  ServerErrorFallback,
  EmptyParticipantsFallback
} from '../../../shared/components/ui/ParticipationFallback';
import { 
  processParticipationError
} from '../../../shared/utils/participationErrorHandler';
import {
  getEventTypeLabel,
  getEventTypeIcon,
  formatEventTime,
  getEventStatusLabel,
  getEventStatusColor,
  AttendanceStatusEnum
} from '../../../shared/constants/eventSchema';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  MessageSquare,
  Edit3,
  Save,
  X,
  GraduationCap,
  Wrench,
  Mic,
  Presentation,
  BookOpen,
  MoreHorizontal
} from 'lucide-react';

// mapeamento de ícones para tipos de evento
const iconMap = {
  'academic-cap': <GraduationCap className="w-6 h-6" />,
  'wrench-screwdriver': <Wrench className="w-6 h-6" />,
  'microphone': <Mic className="w-6 h-6" />,
  'users': <Users className="w-6 h-6" />,
  'presentation-chart-line': <Presentation className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  'ellipsis-horizontal': <MoreHorizontal className="w-6 h-6" />,
  'calendar': <Calendar className="w-6 h-6" />
};

// componente para exibir status de presença
const AttendanceStatusBadge = ({ status }) => {
  const statusConfig = {
    REGISTERED: { 
      label: 'Inscrito', 
      color: 'bg-blue-100 text-blue-800', 
      icon: <User className="w-3 h-3" /> 
    },
    PRESENT: { 
      label: 'Presente', 
      color: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="w-3 h-3" /> 
    },
    ABSENT: { 
      label: 'Ausente', 
      color: 'bg-red-100 text-red-800', 
      icon: <XCircle className="w-3 h-3" /> 
    },
    CANCELED: { 
      label: 'Cancelado', 
      color: 'bg-gray-100 text-gray-800', 
      icon: <AlertCircle className="w-3 h-3" /> 
    }
  };

  const config = statusConfig[status] || statusConfig.REGISTERED;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// componente para lista de participantes
const ParticipantsList = ({ eventId, isOrganizer, onAttendanceUpdate }) => {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingParticipant, setUpdatingParticipant] = useState(null);
  const { success: showSuccess, error: showError } = useToast();

  // carregar lista de participantes
  const loadParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await EventParticipationService.getEventParticipants(eventId);

      if (result.success) {
        // filtrar participantes cancelados da lista
        const activeParticipants = result.data.filter(
          participant => participant.attendanceStatus !== 'CANCELED'
        );
        setParticipants(activeParticipants);
      } else {
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha ao carregar participantes'), 
          'participantsList',
          { eventId }
        );
        
        setError(structuredError); // salvar erro estruturado completo
      }
    } catch (err) {
      console.error('Erro ao carregar participantes:', err);
      
      // processar erro com novo sistema
      const structuredError = processParticipationError(err, 'participantsList', {
        eventId,
        operation: 'loadParticipants'
      });
      
      setError(structuredError);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // atualizar status de presença
  const updateAttendanceStatus = useCallback(async (userId, newStatus) => {
    if (!isOrganizer) return;

    try {
      setUpdatingParticipant(userId);

      const result = await EventParticipationService.updateAttendanceStatus(
        eventId, 
        userId, 
        newStatus
      );

      if (result.success) {
        // atualizar lista local
        setParticipants(prev => 
          prev.map(participant => 
            participant.user.id === userId 
              ? { ...participant, attendanceStatus: newStatus }
              : participant
          )
        );

        showSuccess('Status de presença atualizado com sucesso!');
        
        if (onAttendanceUpdate) {
          onAttendanceUpdate();
        }
      } else {
        showError(result.error?.message || 'Erro ao atualizar status de presença');
      }
    } catch (err) {
      showError('Erro ao atualizar status de presença');
      console.error('Erro ao atualizar presença:', err);
    } finally {
      setUpdatingParticipant(null);
    }
  }, [eventId, isOrganizer, showSuccess, showError, onAttendanceUpdate]);

  useEffect(() => {
    if (eventId) {
      loadParticipants();
    }
  }, [eventId, loadParticipants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Carregando participantes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <SmartParticipationFallback
        error={error}
        context="lista de participantes"
        onRetry={loadParticipants}
        isRetrying={isLoading}
        className="my-4"
      />
    );
  }

  if (participants.length === 0) {
    return (
      <EmptyParticipantsFallback
        eventTitle="este evento"
        isOrganizer={isOrganizer}
        onRefresh={loadParticipants}
        className="my-4"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">
          Participantes ({participants.length})
        </h4>
        {isOrganizer && (
          <button
            onClick={loadParticipants}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Atualizar lista
          </button>
        )}
      </div>

      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              
              <div>
                <p className="font-medium text-gray-900">{participant.user.name}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {participant.user.email}
                  </span>
                  {participant.user.phoneNumber && (
                    <span className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {participant.user.phoneNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inscrito em {new Date(participant.registrationDateTime).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <AttendanceStatusBadge status={participant.attendanceStatus} />
              
              {isOrganizer && (
                <div className="flex space-x-1">
                  {['PRESENT', 'ABSENT'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateAttendanceStatus(participant.user.id, status)}
                      disabled={updatingParticipant === participant.user.id}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        participant.attendanceStatus === status
                          ? status === 'PRESENT' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } ${updatingParticipant === participant.user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {updatingParticipant === participant.user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        status === 'PRESENT' ? 'Presente' : 'Ausente'
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// componente para formulário de feedback
const FeedbackForm = ({ eventId, existingFeedback, onFeedbackSubmit }) => {
  const [feedback, setFeedback] = useState(existingFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim() || feedback.length < 10) {
      showError('Feedback deve ter pelo menos 10 caracteres');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await EventParticipationService.provideFeedback(eventId, feedback.trim());

      if (result.success) {
        showSuccess('Feedback enviado com sucesso!');
        setIsEditing(false);
        
        if (onFeedbackSubmit) {
          onFeedbackSubmit(feedback.trim());
        }
      } else {
        showError(result.error?.message || 'Erro ao enviar feedback');
      }
    } catch (err) {
      showError('Erro ao enviar feedback');
      console.error('Erro ao enviar feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFeedback(existingFeedback || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
          Feedback do Evento
        </h4>
        
        {existingFeedback && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Como foi sua experiência neste evento?
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Compartilhe sua opinião sobre o evento, o que achou do conteúdo, organização, etc..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.length}/1000 caracteres (mínimo 10)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || feedback.length < 10}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 leading-relaxed">{existingFeedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// componente principal do modal
const EventDetailsModal = ({ 
  eventId, 
  isOpen, 
  onClose, 
  showParticipants = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  // estado do modal
  const [event, setEvent] = useState(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [userFeedback, setUserFeedback] = useState(null);
  
  // estado para modal de edição e exclusão
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // participação removida temporariamente
  const isRegistered = false;
  const registrationStatus = 'unknown';
  
  // calcular contagem real de participantes excluindo cancelados
  const [realParticipantsCount, setRealParticipantsCount] = useState(null);
  
  // carregar contagem real de participantes
  const loadRealParticipantsCount = useCallback(async () => {
    if (!eventId) return;
    
    try {
      const result = await EventParticipationService.getParticipantsCount(eventId);
      if (result.success) {
        setRealParticipantsCount(result.data.count);
      }
    } catch (err) {
      console.error('Erro ao carregar contagem de participantes:', err);
    }
  }, [eventId]);
  
  // usar contagem real se disponível, senão usar do evento
  const participantsCount = realParticipantsCount !== null ? realParticipantsCount : (event?.currentParticipants || 0);

  // verificar se usuário é organizador do evento
  const isOrganizer = event && user && event.organizer.id === user.id;
  
  // verificar se evento já terminou
  const isEventCompleted = event && new Date() > new Date(event.endDateTime);
  
  // verificar se pode mostrar feedback
  const canShowFeedback = isEventCompleted && isRegistered;

  // carregar dados do evento
  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    try {
      setIsLoadingEvent(true);
      setEventError(null);

      const result = await EventService.getEventById(eventId);

      if (result.success) {
        setEvent(result.data);
        
        // se mostrar participantes por padrão, definir aba ativa
        if (showParticipants && (isOrganizer || user?.permissions?.includes('EVENT_MANAGE'))) {
          setActiveTab('participants');
        }
      } else {
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha ao carregar evento'), 
          'eventDetails',
          { eventId }
        );
        
        setEventError(structuredError);
      }
    } catch (err) {
      console.error('Erro ao carregar evento:', err);
      
      // processar erro com novo sistema
      const structuredError = processParticipationError(err, 'eventDetails', {
        eventId,
        operation: 'loadEvent'
      });
      
      setEventError(structuredError);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [eventId, showParticipants, isOrganizer, user]);

  // carregar feedback do usuário se aplicável
  const loadUserFeedback = useCallback(async () => {
    if (!canShowFeedback || !eventId) return;

    try {
      // buscar eventos do usuário para verificar se já deu feedback
      const result = await EventParticipationService.getMyEvents();
      
      if (result.success) {
        const eventParticipation = result.data.find(p => p.event.id === eventId);
        if (eventParticipation?.feedback) {
          setUserFeedback(eventParticipation.feedback);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar feedback:', err);
    }
  }, [canShowFeedback, eventId]);

  // efeito para carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && eventId) {
      // validate eventId before loading
      if (typeof eventId !== 'string' && typeof eventId !== 'number') {
        setEventError(processParticipationError(
          new Error('ID do evento inválido'), 
          'eventDetails',
          { eventId, invalidType: typeof eventId }
        ));
        return;
      }
      
      loadEvent();
      loadUserFeedback();
      loadRealParticipantsCount();
    } else {
      // limpar estado quando modal fecha
      setEvent(null);
      setEventError(null);
      setUserFeedback(null);
      setRealParticipantsCount(null);
      setActiveTab('details');
    }
  }, [isOpen, eventId, loadEvent, loadUserFeedback, loadRealParticipantsCount]);

  // handler para atualização de feedback
  const handleFeedbackSubmit = (newFeedback) => {
    setUserFeedback(newFeedback);
  };

  // handler para atualização de presença
  const handleAttendanceUpdate = () => {
    // recarregar contagem de participantes quando há mudança de status
    loadRealParticipantsCount();
  };

  // handlers para ações do evento
  const handleEditEvent = () => {
    setIsEditModalOpen(true);
    // não mostrar toast aqui para evitar interferência com o modal
  };

  const handleDeleteEvent = () => {
    handleConfirmDelete();
  };

  // handler para confirmar exclusão (simplificado)
  const handleConfirmDelete = async () => {
    if (!event?.id || isDeleting) return;

    // confirmação simples
    const hasParticipants = event.currentParticipants > 0;
    const confirmMessage = hasParticipants 
      ? `Tem certeza que deseja excluir o evento "${event.title}"?\n\n${event.currentParticipants} participante${event.currentParticipants !== 1 ? 's' : ''} será${event.currentParticipants !== 1 ? 'ão' : ''} removido${event.currentParticipants !== 1 ? 's' : ''}.\n\nEsta ação não pode ser desfeita.`
      : `Tem certeza que deseja excluir o evento "${event.title}"?\n\nEsta ação não pode ser desfeita.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);

      const result = await EventService.deleteEvent(event.id);

      if (result.success) {
        showSuccess('Evento excluído com sucesso.');
        onClose(); // fechar modal principal
      } else {
        // tratar diferentes tipos de erro de forma mais simples
        const errorMessage = getSimpleDeleteErrorMessage(result.error);
        showError(errorMessage);
      }
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      showError('Erro ao excluir evento. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // handlers para modal de edição
  const handleEditSuccess = (updatedEvent) => {
    // atualizar estado local com dados do evento atualizado
    setEvent(updatedEvent);
    
    // fechar modal de edição
    setIsEditModalOpen(false);
    
    // mensagem simples de confirmação
    showSuccess('Evento atualizado com sucesso.');
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    // não mostrar toast aqui para evitar interferência
  };

  // helper simplificado para mensagens de erro
  const getSimpleDeleteErrorMessage = (error) => {
    if (!error) return 'Erro ao excluir evento';

    // erros de permissão
    if (error.status === 403 || error.type === 'permission_denied') {
      return 'Você não tem permissão para excluir este evento';
    }

    // evento não encontrado
    if (error.status === 404) {
      return 'Evento não encontrado';
    }

    // conflito - evento pode ter participantes ou estar em andamento
    if (error.status === 409 || error.status === 400) {
      return 'Não é possível excluir este evento no momento';
    }

    // erro de validação
    if (error.status === 422) {
      return error.message || 'Dados inválidos para exclusão';
    }

    // erros de rede
    if (error.type === 'network_error') {
      return 'Erro de conexão. Verifique sua internet';
    }

    // erro do servidor
    if (error.status >= 500) {
      return 'Erro interno do servidor. Tente novamente';
    }

    // usar mensagem do erro se disponível
    return error.message || 'Erro ao excluir evento';
  };

  // determinar se pode mostrar aba de participantes
  const canShowParticipantsTab = event && (
    isOrganizer || 
    user?.permissions?.includes('EVENT_MANAGE') || 
    user?.permissions?.includes('ADMIN_ACCESS')
  );

  if (!isOpen) return null;

  return (
    <ErrorBoundary
      componentName="EventDetailsModal"
      onError={(error, errorInfo, errorId) => {
        console.error('Erro no modal de detalhes do evento:', error, errorInfo);
        showError(`Erro no modal de detalhes (${errorId}). Recarregue a página.`);
      }}
      onGoHome={() => onClose()}
    >
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        className="max-w-4xl max-h-[90vh] overflow-hidden"
      >
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 px-6 pt-6">
          {/* Lado esquerdo: Título e informações do evento */}
          <div className="flex items-center space-x-3">
            {event && (
              <>
                <div className="text-green-600">
                  {iconMap[getEventTypeIcon(event.eventType)] || iconMap['calendar']}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isLoadingEvent ? 'Carregando...' : event.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getEventTypeLabel(event.eventType)}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Lado direito: Botões de ação + botão fechar */}
          <div className="flex items-center space-x-4">
            {/* Action Buttons */}
            {event && !isLoadingEvent && (
              <EventActionButtons
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                className=""
                isLoading={isEditModalOpen || isDeleting}
                disabled={isEditModalOpen || isDeleting}
              />
            )}
            
            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="Fechar modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <Modal.Body className="flex-1 overflow-hidden p-0">
          {isLoadingEvent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-3 text-gray-600">Carregando detalhes do evento...</span>
            </div>
          ) : eventError ? (
            <div className="px-6 py-12">
              <SmartParticipationFallback
                error={eventError}
                context="detalhes do evento"
                onRetry={loadEvent}
                isRetrying={isLoadingEvent}
                onGoHome={() => onClose()}
                className="max-w-md mx-auto"
              />
            </div>
          ) : event ? (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex-shrink-0 border-b border-gray-200 px-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'details'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Detalhes
                  </button>
                  
                  {canShowParticipantsTab && (
                  <button
                      onClick={() => setActiveTab('participants')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'participants'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Participantes ({participantsCount})
                    </button>
                  )}
                  
                  {canShowFeedback && (
                    <button
                      onClick={() => setActiveTab('feedback')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'feedback'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Feedback
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        getEventStatusColor(event.status) === 'green' ? 'bg-green-100 text-green-800' :
                        getEventStatusColor(event.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        getEventStatusColor(event.status) === 'red' ? 'bg-red-100 text-red-800' :
                        getEventStatusColor(event.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                        getEventStatusColor(event.status) === 'purple' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getEventStatusLabel(event.status)}
                      </span>
                      
                      <div className="text-sm text-gray-600">
                        {participantsCount}/{event.maxParticipants} participantes
                      </div>
                    </div>

                    {/* Event Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Data e Horário */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Data</p>
                            <p className="text-gray-600">
                              {new Date(event.startDateTime).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Horário</p>
                            <p className="text-gray-600">
                              {formatEventTime(event.startDateTime)} às {formatEventTime(event.endDateTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Local</p>
                            <p className="text-gray-600">
                              {event.room?.name || 'A definir'}
                              {event.room?.location && (
                                <span className="text-gray-500"> - {event.room.location}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Organizador */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Organizador</p>
                            <p className="text-gray-600">{event.organizer.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Contato</p>
                            <p className="text-gray-600">{event.organizer.email}</p>
                          </div>
                        </div>

                        {event.organizer.phoneNumber && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">Telefone</p>
                              <p className="text-gray-600">{event.organizer.phoneNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Descrição</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    {(event.approvedBy || event.rejectionReason) && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Informações Administrativas</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {event.approvedBy && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Aprovado por:</span> {event.approvedBy.name}
                              {event.approvalDateTime && (
                                <span className="ml-2">
                                  em {new Date(event.approvalDateTime).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </p>
                          )}
                          
                          {event.rejectionReason && (
                            <p className="text-sm text-red-600">
                              <span className="font-medium">Motivo da rejeição:</span> {event.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'participants' && canShowParticipantsTab && (
                  <div className="p-6">
                    <ParticipantsList
                      eventId={eventId}
                      isOrganizer={isOrganizer}
                      onAttendanceUpdate={handleAttendanceUpdate}
                    />
                  </div>
                )}

                {activeTab === 'feedback' && canShowFeedback && (
                  <div className="p-6">
                    <FeedbackForm
                      eventId={eventId}
                      existingFeedback={userFeedback}
                      onFeedbackSubmit={handleFeedbackSubmit}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Modal.Body>

        {/* Footer com botões de ação */}
        {event && isAuthenticated && (
          <Modal.Footer className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                {isRegistered ? (
                  <span className="text-green-600 font-medium">✓ Você está inscrito</span>
                ) : registrationStatus === 'full' ? (
                  <span className="text-red-600">Evento lotado</span>
                ) : registrationStatus === 'closed' ? (
                  <span className="text-gray-600">Inscrições encerradas</span>
                ) : (
                  <span>Inscrições abertas</span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Fechar
                </button>

                {/* Participation functionality temporarily disabled */}
              </div>
            </div>
          </Modal.Footer>
        )}
      </div>

      {/* Modal de edição de evento */}
      {event && (
        <EditEventModal
          event={event}
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccess}
        />
      )}
    </Modal>
    </ErrorBoundary>
  );
};

export default EventDetailsModal;