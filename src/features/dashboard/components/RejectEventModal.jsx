import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../shared/components/ui';
import { validateEventReject } from '../../../shared/constants/eventSchema';
import { EventService } from '../../events/services';
import { useToast } from '../../../shared/hooks';

const RejectEventModal = ({ 
  isOpen, 
  event, 
  onClose, 
  onReject, 
  isSubmitting = false 
}) => {
  const { success, error } = useToast();
  
  // estado do formulário
  const [formData, setFormData] = useState({
    rejectionReason: ''
  });

  // estado de validação e submissão
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setFormData({ rejectionReason: '' });
      setErrors({});
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleInputChange = (value) => {
    setFormData(prev => ({ ...prev, rejectionReason: value }));
    
    // limpar erro do campo quando usuário digita
    if (errors.rejectionReason) {
      setErrors(prev => ({ ...prev, rejectionReason: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!event) {
      error('Evento não encontrado');
      return;
    }

    // validar dados
    const validation = validateEventReject(formData);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      const result = await EventService.rejectEvent(event.id, validation.data);
      
      if (result.success) {
        success('Evento rejeitado com sucesso!');
        onReject?.(event.id, formData.rejectionReason);
        handleClose();
      } else {
        error(result.error?.message || 'Erro ao rejeitar evento');
        
        // se houver erros específicos de campo, mostrar
        if (result.error?.fieldErrors) {
          setErrors(result.error.fieldErrors);
        }
      }
    } catch {
      error('Erro inesperado ao rejeitar evento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // resetar formulário
    setFormData({ rejectionReason: '' });
    setErrors({});
    setIsProcessing(false);
    onClose();
  };

  // calcular caracteres restantes
  const remainingChars = 500 - formData.rejectionReason.length;
  const isOverLimit = remainingChars < 0;
  const isUnderMinimum = formData.rejectionReason.length < 10;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="md" 
      title="Rejeitar Evento"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações do evento */}
        {event && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Evento a ser rejeitado:</h4>
            <p className="text-sm text-gray-700 font-medium">{event.title}</p>
            <p className="text-sm text-gray-600">
              Organizador: {event.organizer?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              Data: {new Date(event.startDateTime).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {/* Campo de justificativa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Justificativa da Rejeição <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.rejectionReason}
            onChange={(e) => handleInputChange(e.target.value)}
            rows={4}
            className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
              errors.rejectionReason || isOverLimit 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            placeholder="Explique o motivo da rejeição do evento (mínimo 10 caracteres, máximo 500 caracteres)..."
            disabled={isProcessing || isSubmitting}
          />
          
          {/* Contador de caracteres */}
          <div className="flex justify-between items-center mt-1">
            <div>
              {errors.rejectionReason && (
                <p className="text-sm text-red-600">{errors.rejectionReason}</p>
              )}
            </div>
            <p className={`text-xs ${
              isOverLimit ? 'text-red-600' : 
              isUnderMinimum ? 'text-yellow-600' : 
              'text-gray-500'
            }`}>
              {formData.rejectionReason.length}/500 caracteres
              {isUnderMinimum && formData.rejectionReason.length > 0 && 
                ` (mínimo: 10)`
              }
            </p>
          </div>
        </div>

        {/* Aviso sobre a ação */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. O evento será rejeitado permanentemente e o organizador será notificado.
              </p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing || isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={isProcessing || isSubmitting}
            disabled={isProcessing || isSubmitting || isOverLimit || isUnderMinimum || !formData.rejectionReason.trim()}
          >
            Rejeitar Evento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectEventModal;