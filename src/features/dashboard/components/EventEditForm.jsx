import { useState, useEffect, useCallback } from 'react';
import { Input, Select, Button } from '../../../shared/components/ui';
import { 
  EVENT_TYPES, 
  EVENT_STATUSES, 
  validateEventUpdate 
} from '../../../shared/constants/eventSchema';
import { RoomService } from '../../rooms/services';
import { useToast } from '../../../shared/hooks';
import { Loader2 } from 'lucide-react';

const EventEditForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  onChange,
  isSubmitting = false, 
  errors: externalErrors = {},
  disabled = false 
}) => {
  // estado do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    startDateTime: '',
    endDateTime: '',
    maxParticipants: '',
    eventType: '',
    status: '',
    publicEvent: true,
    rejectionReason: ''
  });

  // estado para salas
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingRoomCapacity, setLoadingRoomCapacity] = useState(false);

  // estado de validação
  const [validationErrors, setValidationErrors] = useState({});
  const [roomCapacityError, setRoomCapacityError] = useState('');
  const [validationTimeout, setValidationTimeout] = useState(null);
  
  // toast context para notificações
  const { error: showError, warning: showWarning } = useToast();

  // inicializar formulário com dados existentes
  useEffect(() => {
    if (initialData) {
      // converter datas para formato datetime-local (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          // verificar se a data é válida
          if (isNaN(date.getTime())) return '';
          
          // ajustar para timezone local para evitar problemas de fuso horário
          const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          return localDate.toISOString().slice(0, 16);
        } catch (error) {
          console.error('Erro ao formatar data:', error);
          return '';
        }
      };

      const startDateTime = formatDateTimeLocal(initialData.startDateTime);
      const endDateTime = formatDateTimeLocal(initialData.endDateTime);

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        roomId: initialData.room?.id || initialData.roomId || '',
        startDateTime,
        endDateTime,
        maxParticipants: initialData.maxParticipants?.toString() || '',
        eventType: initialData.eventType || '',
        status: initialData.status || '',
        publicEvent: initialData.publicEvent ?? true,
        rejectionReason: initialData.rejectionReason || ''
      });

      // se já tem roomId, buscar dados da sala quando as salas estiverem carregadas
      if (initialData.room?.id || initialData.roomId) {
        // se já temos a sala nos dados iniciais, usar ela
        if (initialData.room && initialData.room.capacity) {
          setSelectedRoom(initialData.room);
        }
        // senão, será buscada quando as salas carregarem
      }
    }
  }, [initialData]);

  // carregar salas quando componente monta
  useEffect(() => {
    loadRooms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // atualizar sala selecionada quando salas carregam e temos roomId
  useEffect(() => {
    if (rooms.length > 0 && formData.roomId && !selectedRoom) {
      const room = rooms.find(r => r.id === formData.roomId);
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [rooms, formData.roomId, selectedRoom]);

  // validar capacidade da sala quando sala ou maxParticipants muda
  useEffect(() => {
    if (formData.roomId && formData.maxParticipants) {
      validateRoomCapacity(formData.roomId, formData.maxParticipants);
    } else {
      setRoomCapacityError('');
    }
  }, [formData.roomId, formData.maxParticipants]); // eslint-disable-line react-hooks/exhaustive-deps

  // cleanup timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const result = await RoomService.getAllRooms({ size: 1000 });
      if (result.success) {
        setRooms(result.data.content);
        
        // se já tem uma sala selecionada no formData, buscar seus dados
        if (formData.roomId) {
          const room = result.data.content.find(r => r.id === formData.roomId);
          if (room) {
            setSelectedRoom(room);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
      showError('❌ Erro ao carregar lista de salas. Verifique sua conexão e recarregue a página.');
    } finally {
      setLoadingRooms(false);
    }
  };

  // função para validar capacidade da sala
  const validateRoomCapacity = useCallback(async (roomId, maxParticipants) => {
    // limpar erro anterior
    setRoomCapacityError('');
    
    // se não tem dados suficientes, não validar
    if (!roomId || !maxParticipants || maxParticipants === '') {
      return;
    }

    const participantsNumber = parseInt(maxParticipants);
    
    // validar se é um número válido
    if (isNaN(participantsNumber) || participantsNumber <= 0) {
      return;
    }

    setLoadingRoomCapacity(true);
    
    try {
      // primeiro tentar usar a sala já carregada se disponível
      let roomData = selectedRoom;
      
      // se não temos a sala ou o ID mudou, buscar do servidor
      if (!roomData || roomData.id !== roomId) {
        const result = await RoomService.getRoomById(roomId);
        
        if (!result.success) {
          setRoomCapacityError('Erro ao verificar capacidade da sala');
          return;
        }
        
        roomData = result.data;
        setSelectedRoom(roomData);
      }

      // validar capacidade
      if (roomData.capacity && participantsNumber > roomData.capacity) {
        setRoomCapacityError(
          `A capacidade máxima (${participantsNumber}) excede a capacidade da sala (${roomData.capacity})`
        );
      } else if (!roomData.capacity) {
        // se a sala não tem capacidade definida, mostrar aviso
        setRoomCapacityError('Capacidade da sala não definida - verifique com o administrador');
      }
      
    } catch (error) {
      console.error('Erro ao validar capacidade da sala:', error);
      setRoomCapacityError('Erro ao verificar capacidade da sala');
      showError('❌ Erro ao verificar capacidade da sala. Verifique sua conexão.');
    } finally {
      setLoadingRoomCapacity(false);
    }
  }, [selectedRoom]);

  // função para validação com debounce
  const debouncedValidateRoomCapacity = useCallback((roomId, maxParticipants) => {
    // limpar timeout anterior se existir
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // criar novo timeout para validação
    const timeoutId = setTimeout(() => {
      validateRoomCapacity(roomId, maxParticipants);
    }, 500); // 500ms de debounce

    setValidationTimeout(timeoutId);
  }, [validateRoomCapacity, validationTimeout]);

  const handleInputChange = (field, value) => {
    // prevenir mudanças durante submissão ou se desabilitado
    if (isSubmitting || disabled) {
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // notificar componente pai sobre mudanças
    if (onChange) {
      onChange();
    }
    
    // limpar erros quando usuário digita
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
    if (externalErrors[field]) {
      // não podemos limpar erros externos diretamente, mas podemos indicar que o campo foi modificado
    }

    // se mudou a sala, buscar dados da nova sala e validar capacidade
    if (field === 'roomId' && value) {
      const room = rooms.find(r => r.id === value);
      setSelectedRoom(room);
      
      // limpar erro de capacidade anterior
      setRoomCapacityError('');
      
      // validar capacidade imediatamente se já temos maxParticipants (sem debounce para mudança de sala)
      if (formData.maxParticipants) {
        validateRoomCapacity(value, formData.maxParticipants);
      }
    }
    
    // se mudou maxParticipants, validar capacidade com debounce se já temos sala
    if (field === 'maxParticipants' && formData.roomId) {
      // limpar erro anterior imediatamente para melhor UX
      setRoomCapacityError('');
      debouncedValidateRoomCapacity(formData.roomId, value);
    }

    // se mudou o status para algo diferente de REJECTED, limpar motivo da rejeição
    if (field === 'status' && value !== 'REJECTED') {
      setFormData(prev => ({ ...prev, rejectionReason: '' }));
      if (validationErrors.rejectionReason) {
        setValidationErrors(prev => ({ ...prev, rejectionReason: null }));
      }
    }

    // validação em tempo real para datas
    if (field === 'startDateTime' || field === 'endDateTime') {
      // limpar erros de data quando usuário modifica
      if (validationErrors.startDateTime || validationErrors.endDateTime) {
        setValidationErrors(prev => ({
          ...prev,
          startDateTime: null,
          endDateTime: null
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // prevenir múltiplas submissões
    if (isSubmitting) {
      return;
    }
    
    // preparar dados para validação
    const dataToValidate = {
      ...formData,
      maxParticipants: parseInt(formData.maxParticipants) || 0,
      // converter datas de volta para ISO string com tratamento de timezone
      startDateTime: formData.startDateTime ? new Date(formData.startDateTime).toISOString() : '',
      endDateTime: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : ''
    };

    // validar dados com schema
    const validation = validateEventUpdate(dataToValidate);
    
    if (!validation.success) {
      setValidationErrors(validation.errors);
      // mostrar toast com informação sobre os erros
      const errorCount = Object.keys(validation.errors).length;
      showWarning(`⚠️ Corrija ${errorCount} erro${errorCount !== 1 ? 's' : ''} no formulário antes de salvar.`);
      
      // focar no primeiro campo com erro para melhor UX
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.focus();
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // verificar erro de capacidade da sala
    if (roomCapacityError) {
      showWarning('⚠️ Corrija o erro de capacidade da sala antes de salvar.');
      // focar no campo de capacidade máxima
      const capacityField = document.querySelector('input[type="number"]');
      if (capacityField) {
        capacityField.focus();
        capacityField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // verificar se ainda está validando capacidade da sala
    if (loadingRoomCapacity) {
      // aguardar um pouco e tentar novamente
      setTimeout(() => handleSubmit(e), 500);
      return;
    }

    // limpar erros e submeter
    setValidationErrors({});
    
    try {
      await onSubmit(validation.data);
    } catch (error) {
      // erro já será tratado pelo componente pai
      console.error('Erro na submissão do formulário:', error);
    }
  };

  // combinar erros de validação local e externos
  const getAllErrors = () => {
    return { ...validationErrors, ...externalErrors };
  };

  const allErrors = getAllErrors();

  // opções para o select de salas
  const roomOptions = rooms
    .filter(room => room.status === 'AVAILABLE')
    .map(room => ({
      value: room.id,
      label: `${room.name} - ${room.location || 'Sem localização'} (Cap: ${room.capacity || 'N/A'})`
    }));

  // opções para tipo de evento
  const eventTypeOptions = EVENT_TYPES.map(type => ({
    value: type.value,
    label: type.label
  }));

  // opções para status do evento
  const statusOptions = EVENT_STATUSES.map(status => ({
    value: status.value,
    label: status.label
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Título */}
        <div className="lg:col-span-2">
          <Input
            label="Título do Evento"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={allErrors.title}
            required
            placeholder="Digite o título do evento"
            disabled={isSubmitting}
            className="text-base"
          />
        </div>

        {/* Descrição */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição <span className="text-danger-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            disabled={isSubmitting}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="Descreva o evento detalhadamente..."
          />
          {allErrors.description && (
            <p className="text-sm text-danger-600 mt-1">{allErrors.description}</p>
          )}
        </div>

        {/* Tipo de Evento */}
        <Select
          label="Tipo de Evento"
          value={formData.eventType}
          onChange={(e) => handleInputChange('eventType', e.target.value)}
          options={eventTypeOptions}
          error={allErrors.eventType}
          required
          placeholder="Selecione o tipo"
          disabled={isSubmitting}
        />

        {/* Status do Evento */}
        <Select
          label="Status do Evento"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          options={statusOptions}
          error={allErrors.status}
          required
          placeholder="Selecione o status"
          disabled={isSubmitting}
        />

        {/* Motivo da Rejeição - só aparece se status for REJECTED */}
        {formData.status === 'REJECTED' && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Rejeição <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.rejectionReason}
              onChange={(e) => handleInputChange('rejectionReason', e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Explique detalhadamente o motivo da rejeição..."
            />
            {allErrors.rejectionReason && (
              <p className="text-sm text-danger-600 mt-1">{allErrors.rejectionReason}</p>
            )}
          </div>
        )}

        {/* Capacidade Máxima */}
        <Input
          label="Capacidade Máxima"
          type="number"
          value={formData.maxParticipants}
          onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
          error={allErrors.maxParticipants || roomCapacityError}
          required
          min="1"
          placeholder="Ex: 30"
          disabled={isSubmitting}
        />

        {/* Sala */}
        <div>
          <Select
            label="Sala"
            value={formData.roomId}
            onChange={(e) => handleInputChange('roomId', e.target.value)}
            options={roomOptions}
            error={allErrors.roomId}
            required
            placeholder={loadingRooms ? "Carregando salas..." : "Selecione uma sala"}
            disabled={loadingRooms || isSubmitting}
          />
          {selectedRoom && (
            <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800 font-medium">
                📍 {selectedRoom.name}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                Capacidade: {selectedRoom.capacity || 'N/A'} pessoas
                {selectedRoom.location && ` • ${selectedRoom.location}`}
              </p>
              {loadingRoomCapacity && (
                <div className="flex items-center mt-2 text-sm text-secondary-600">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Verificando capacidade...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data/Hora de Início */}
        <Input
          label="Data e Hora de Início"
          type="datetime-local"
          value={formData.startDateTime}
          onChange={(e) => handleInputChange('startDateTime', e.target.value)}
          error={allErrors.startDateTime}
          required
          disabled={isSubmitting}
        />

        {/* Data/Hora de Fim */}
        <Input
          label="Data e Hora de Fim"
          type="datetime-local"
          value={formData.endDateTime}
          onChange={(e) => handleInputChange('endDateTime', e.target.value)}
          error={allErrors.endDateTime}
          required
          disabled={isSubmitting}
        />

        {/* Evento Público */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              id="publicEvent"
              checked={formData.publicEvent}
              onChange={(e) => handleInputChange('publicEvent', e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 disabled:opacity-50"
            />
            <div className="flex-1">
              <label htmlFor="publicEvent" className="text-sm font-medium text-gray-900 cursor-pointer">
                Evento público
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Quando marcado, o evento será visível para todos os usuários. Caso contrário, apenas participantes inscritos poderão visualizá-lo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de validação em andamento */}
      {loadingRoomCapacity && (
        <div className="flex items-center justify-center py-4 bg-secondary-50 border border-secondary-200 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-secondary-600 mr-3" />
          <span className="text-sm font-medium text-secondary-800">Validando capacidade da sala...</span>
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="order-2 sm:order-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting || !!roomCapacityError || loadingRoomCapacity}
          className="order-1 sm:order-2"
          title={
            roomCapacityError 
              ? 'Corrija o erro de capacidade antes de salvar'
              : loadingRoomCapacity 
                ? 'Aguarde a validação da capacidade'
                : isSubmitting
                  ? 'Salvando alterações...'
                  : 'Salvar as alterações do evento'
          }
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
};

export default EventEditForm;