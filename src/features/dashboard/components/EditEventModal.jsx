import { useState, useEffect } from 'react';
import { Modal, Button, ErrorBoundary } from '../../../shared/components/ui';
import EventEditForm from './EventEditForm';
import { useToast } from '../../../shared/hooks';
import { EventService } from '../../events/services';
import { processParticipationError } from '../../../shared/utils/participationErrorHandler';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';

const EditEventModal = ({ 
  event, 
  isOpen, 
  onClose, 
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState({});
  const [modalError, setModalError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { success, error } = useToast();

  // resetar estado quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setSubmitErrors({});
      setModalError(null);
      setHasUnsavedChanges(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  // validar se evento existe
  useEffect(() => {
    if (isOpen && !event) {
      setModalError('Dados do evento não disponíveis');
      error('Erro: dados do evento não foram carregados corretamente');
    }
  }, [isOpen, event, error]);

  if (!isOpen) return null;

  // handler para detectar mudanças no formulário
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  // handler para fechar modal com validação de mudanças não salvas
  const handleClose = async () => {
    if (isSubmitting) {
      error('⏳ Aguarde a operação terminar antes de fechar o modal.');
      return;
    }

    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja fechar sem salvar?'
      );
      if (!confirmClose) {
        return;
      }
    }

    setIsClosing(true);
    setSubmitErrors({});
    setModalError(null);
    setHasUnsavedChanges(false);
    
    try {
      await onClose();
    } catch (err) {
      console.error('Erro ao fechar modal:', err);
      error('Erro ao fechar modal');
    } finally {
      setIsClosing(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitErrors({});
    setModalError(null);

    // implementar optimistic update - criar dados otimistas
    const optimisticEventData = {
      ...event,
      ...formData,
      // manter dados que não podem ser alterados
      id: event.id,
      organizer: event.organizer,
      createdAt: event.createdAt,
      updatedAt: new Date().toISOString()
    };

    try {
      // validar dados básicos antes de enviar
      if (!event?.id) {
        throw new Error('ID do evento não disponível');
      }

      if (!formData || Object.keys(formData).length === 0) {
        throw new Error('Dados do formulário não disponíveis');
      }

      // aplicar update otimista imediatamente
      if (onSuccess) {
        onSuccess(optimisticEventData);
      }
      
      // fazer a requisição real
      const result = await EventService.updateEvent(event.id, formData);
      
      if (result.success) {
        // atualizar com dados reais do servidor
        if (onSuccess) {
          onSuccess(result.data);
        }
        success('Evento atualizado com sucesso.');
        setHasUnsavedChanges(false);
        await handleClose();
      } else {
        // reverter update otimista em caso de erro
        if (onSuccess) {
          onSuccess(event);
        }
        
        // processar erro estruturado
        const structuredError = result.error || processParticipationError(
          new Error('Falha ao atualizar evento'),
          'eventUpdate',
          { eventId: event.id, formData }
        );

        // tratar diferentes tipos de erro
        switch (structuredError.category || structuredError.type) {
          case 'VALIDATION_ERROR':
          case 'validation':
            // erros de validação do servidor
            if (structuredError.details && Array.isArray(structuredError.details)) {
              const fieldErrors = {};
              structuredError.details.forEach(detail => {
                if (detail.field) {
                  fieldErrors[detail.field] = detail.message;
                }
              });
              setSubmitErrors(fieldErrors);
            } else {
              setSubmitErrors({ general: structuredError.userMessage || structuredError.message });
            }
            error('❌ Dados inválidos. Verifique os campos destacados e corrija os erros antes de tentar novamente.');
            break;
              
          case 'AUTHORIZATION_ERROR':
          case 'authorization':
            setModalError('Você não tem permissão para editar este evento');
            error('🚫 Você não tem permissão para editar este evento. Entre em contato com um administrador se necessário.');
            break;
              
          case 'not_found':
            setModalError('Evento não encontrado. Pode ter sido removido.');
            error('❌ Evento não encontrado. Pode ter sido removido por outro usuário. O modal será fechado automaticamente.');
            setTimeout(() => handleClose(), 2000); // fechar modal após 2 segundos
            break;
              
          case 'BUSINESS_LOGIC_ERROR':
          case 'conflict':
            setModalError('Conflito de dados. O evento pode ter sido modificado por outro usuário.');
            error('⚠️ Conflito de dados. O evento pode ter sido modificado por outro usuário. Feche e reabra o modal para ver as alterações mais recentes.');
            break;
              
          case 'unprocessable':
            if (structuredError.details && Array.isArray(structuredError.details)) {
              const fieldErrors = {};
              structuredError.details.forEach(detail => {
                if (detail.field) {
                  fieldErrors[detail.field] = detail.message;
                }
              });
              setSubmitErrors(fieldErrors);
            }
            error(structuredError.userMessage || structuredError.message || 'Dados não puderam ser processados');
            break;
              
          case 'NETWORK_ERROR':
          case 'network':
            setModalError('Erro de conexão. Verifique sua internet e tente novamente.');
            error('🌐 Erro de conexão. Verifique sua internet e tente novamente. Suas alterações não foram perdidas.');
            break;

          case 'SERVER_ERROR':
            setModalError('Erro interno do servidor. Tente novamente mais tarde.');
            error('🔧 Erro interno do servidor. Tente novamente em alguns minutos ou entre em contato com o suporte.');
            break;
              
          default:
            setModalError(structuredError.userMessage || structuredError.message || 'Erro ao atualizar evento');
            error(structuredError.userMessage || structuredError.message || 'Erro ao atualizar evento');
        }
      }
    } catch (err) {
      // reverter update otimista em caso de erro inesperado
      if (onSuccess) {
        onSuccess(event);
      }
      
      console.error('Erro inesperado ao atualizar evento:', err);
      
      // processar erro com sistema estruturado
      const structuredError = processParticipationError(err, 'eventUpdate', {
        eventId: event?.id,
        operation: 'updateEvent'
      });

      setModalError(structuredError.userMessage);
      
      // tratar erros específicos que podem não ter sido capturados pelo service
      if (err.response) {
        const status = err.response.status;
        switch (status) {
          case 400:
            error('Dados inválidos enviados para o servidor');
            break;
          case 401:
            error('Sessão expirada. Faça login novamente.');
            break;
          case 403:
            error('Você não tem permissão para editar este evento');
            break;
          case 404:
            error('Evento não encontrado');
            setTimeout(() => handleClose(), 2000);
            break;
          case 409:
            error('Conflito: o evento pode ter sido modificado por outro usuário');
            break;
          case 422:
            error('Dados não puderam ser processados pelo servidor');
            break;
          case 500:
            error('Erro interno do servidor. Tente novamente mais tarde.');
            break;
          default:
            error('Erro inesperado do servidor');
        }
      } else if (err.request) {
        error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        error('Erro inesperado ao processar a solicitação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      error('⏳ Aguarde a operação terminar antes de cancelar.');
      return;
    }
    
    handleClose();
  };

  return (
    <ErrorBoundary
      componentName="EditEventModal"
      onError={(error, errorInfo, errorId) => {
        console.error('Erro no modal de edição:', error, errorInfo);
        setModalError(`Erro interno no modal (${errorId}). Recarregue a página.`);
      }}
    >
      <Modal
        isOpen={isOpen}
        onClose={isClosing ? undefined : handleCancel}
        size="lg"
        className="max-w-2xl animate-fade-in"
      >
        {/* Modal Header */}
        <Modal.Header onClose={isClosing ? undefined : handleCancel}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {isSubmitting && (
                <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-secondary-600" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isSubmitting ? 'Salvando Evento...' : 'Editar Evento'}
                </h2>
                {event && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {event.title}
                  </p>
                )}
              </div>
            </div>
            
            {/* Indicador de mudanças não salvas */}
            {hasUnsavedChanges && !isSubmitting && (
              <div className="flex items-center text-warning-600 text-sm bg-warning-50 px-3 py-1.5 rounded-full border border-warning-200">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                <span className="font-medium">Alterações não salvas</span>
              </div>
            )}
          </div>
        </Modal.Header>

        {/* Modal Body */}
        <Modal.Body className="px-6 py-4">
          {/* Mostrar erro do modal se houver */}
          {modalError && (
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-danger-800">
                  <p className="font-semibold mb-1">Erro no modal</p>
                  <p className="leading-relaxed">{modalError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar loading overlay se necessário */}
          {isClosing && (
            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-secondary-600 animate-spin" />
                <div className="text-sm text-secondary-800">
                  <p className="font-semibold">Fechando modal...</p>
                  <p className="mt-1">Aguarde um momento.</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulário de edição */}
          {event ? (
            <EventEditForm
              initialData={event}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              onChange={handleFormChange}
              isSubmitting={isSubmitting}
              errors={submitErrors}
              disabled={isClosing}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-danger-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Dados do evento não disponíveis
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                  Não foi possível carregar os dados do evento para edição.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="px-6"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>

        {/* Loading overlay para toda a modal se necessário */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 animate-spin text-secondary-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Salvando alterações...</p>
              <p className="text-xs text-gray-500">Não feche esta janela</p>
            </div>
          </div>
        )}
      </Modal>
    </ErrorBoundary>
  );
};

export default EditEventModal;