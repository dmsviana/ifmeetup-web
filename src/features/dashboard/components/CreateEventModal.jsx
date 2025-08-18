import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../../shared/components/ui';
import { EVENT_TYPES, validateEventCreate } from '../../../shared/constants/eventSchema';
import { EventService } from '../../events/services';
import { RoomService } from '../../rooms/services';
import { useToast } from '../../../shared/hooks';

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const { success, error } = useToast();
  
  // estado do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    startDateTime: '',
    endDateTime: '',
    maxParticipants: '',
    eventType: '',
    publicEvent: true
  });

  // estado para salas
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // estado de validação e submissão
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // carregar salas quando modal abre
  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  // filtrar salas por capacidade quando maxParticipants muda
  useEffect(() => {
    if (formData.maxParticipants && rooms.length > 0) {
      const capacity = parseInt(formData.maxParticipants);
      if (!isNaN(capacity)) {
        const filtered = rooms.filter(room => 
          room.capacity >= capacity && room.status === 'AVAILABLE'
        );
        setFilteredRooms(filtered);
      } else {
        setFilteredRooms(rooms.filter(room => room.status === 'AVAILABLE'));
      }
    } else {
      setFilteredRooms(rooms.filter(room => room.status === 'AVAILABLE'));
    }
  }, [formData.maxParticipants, rooms]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const result = await RoomService.getAllRooms({ size: 1000 });
      if (result.success) {
        setRooms(result.data.content);
        setFilteredRooms(result.data.content.filter(room => room.status === 'AVAILABLE'));
      } else {
        error('Erro ao carregar salas');
      }
    } catch (err) {
      error('Erro ao carregar salas');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMaxParticipantsBlur = () => {
    // trigger do filtro de salas quando sai do campo de capacidade
    // o useEffect já cuida da filtragem
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // preparar dados para validação
    const dataToValidate = {
      ...formData,
      maxParticipants: parseInt(formData.maxParticipants) || 0
    };

    // validar dados
    const validation = validateEventCreate(dataToValidate);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await EventService.createEvent(validation.data);
      
      if (result.success) {
        success('Evento criado com sucesso!');
        onEventCreated?.(result.data);
        handleClose();
      } else {
        error(result.error?.message || 'Erro ao criar evento');
        
        // se houver erros específicos de campo, mostrar
        if (result.error?.fieldErrors) {
          setErrors(result.error.fieldErrors);
        }
      }
    } catch (err) {
      error('Erro inesperado ao criar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // resetar formulário
    setFormData({
      title: '',
      description: '',
      roomId: '',
      startDateTime: '',
      endDateTime: '',
      maxParticipants: '',
      eventType: '',
      publicEvent: true
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // opções para o select de salas
  const roomOptions = filteredRooms.map(room => ({
    value: room.id,
    label: `${room.name} - ${room.location || 'Sem localização'} (Cap: ${room.capacity || 'N/A'})`
  }));

  // opções para tipo de evento
  const eventTypeOptions = EVENT_TYPES.map(type => ({
    value: type.value,
    label: type.label
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="Criar Novo Evento">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Título */}
          <div className="md:col-span-2">
            <Input
              label="Título do Evento"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              required
              placeholder="Digite o título do evento"
            />
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva o evento..."
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Tipo de Evento */}
          <Select
            label="Tipo de Evento"
            value={formData.eventType}
            onChange={(e) => handleInputChange('eventType', e.target.value)}
            options={eventTypeOptions}
            error={errors.eventType}
            required
            placeholder="Selecione o tipo"
          />

          {/* Capacidade Máxima */}
          <Input
            label="Capacidade Máxima"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
            onBlur={handleMaxParticipantsBlur}
            error={errors.maxParticipants}
            required
            min="1"
            placeholder="Ex: 30"
          />

          {/* Sala */}
          <div className="md:col-span-2">
            <Select
              label="Sala"
              value={formData.roomId}
              onChange={(e) => handleInputChange('roomId', e.target.value)}
              options={roomOptions}
              error={errors.roomId}
              required
              placeholder={loadingRooms ? "Carregando salas..." : "Selecione uma sala"}
              disabled={loadingRooms}
            />
            {formData.maxParticipants && filteredRooms.length < rooms.length && (
              <p className="text-sm text-blue-600 mt-1">
                Mostrando apenas salas com capacidade ≥ {formData.maxParticipants} pessoas
              </p>
            )}
          </div>

          {/* Data/Hora de Início */}
          <Input
            label="Data e Hora de Início"
            type="datetime-local"
            value={formData.startDateTime}
            onChange={(e) => handleInputChange('startDateTime', e.target.value)}
            error={errors.startDateTime}
            required
          />

          {/* Data/Hora de Fim */}
          <Input
            label="Data e Hora de Fim"
            type="datetime-local"
            value={formData.endDateTime}
            onChange={(e) => handleInputChange('endDateTime', e.target.value)}
            error={errors.endDateTime}
            required
          />

          {/* Evento Público */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.publicEvent}
                onChange={(e) => handleInputChange('publicEvent', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Evento público (visível para todos)</span>
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Criar Evento
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventModal;