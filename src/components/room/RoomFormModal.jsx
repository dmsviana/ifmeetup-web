import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { validateRoom, ROOM_TYPES, ROOM_STATUSES, RESOURCE_TYPES } from '../../schemas/roomSchema';
import { RoomService } from '../../services';

const ResourceForm = ({ resource, onChange, onRemove, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({
      ...resource,
      [field]: field === 'quantity' ? parseInt(value) || 0 : value
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Recurso</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          type="button"
          aria-label="Remover recurso"
        >
          Remover
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de Recurso"
          value={resource.resourceType || ''}
          onChange={(e) => handleChange('resourceType', e.target.value)}
          options={RESOURCE_TYPES}
          placeholder="Selecione o tipo"
          required
          error={errors.resourceType}
        />
        
        <Input
          label="Quantidade"
          type="number"
          value={resource.quantity || ''}
          onChange={(e) => handleChange('quantity', e.target.value)}
          placeholder="Ex: 1"
          min="0"
          max="999"
          required
          error={errors.quantity}
        />
      </div>
      
      <Input
        label="Detalhes"
        value={resource.details || ''}
        onChange={(e) => handleChange('details', e.target.value)}
        placeholder="Informações adicionais sobre o recurso"
        error={errors.details}
      />
    </div>
  );
};

const RoomFormModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', // 'create' ou 'edit'
  initialData = null,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    type: '',
    status: 'AVAILABLE',
    description: '',
    resources: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // inicializar dados do formulário quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          location: initialData.location || '',
          capacity: initialData.capacity?.toString() || '',
          type: initialData.type || '',
          status: initialData.status || 'AVAILABLE',
          description: initialData.description || '',
          resources: initialData.resources || []
        });
      } else {
        // resetar para criação
        setFormData({
          name: '',
          location: '',
          capacity: '',
          type: '',
          status: 'AVAILABLE',
          description: '',
          resources: []
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'capacity' ? value : value
    }));
    
    // limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { resourceType: '', quantity: 1, details: '' }]
    }));
  };

  const handleResourceChange = (index, updatedResource) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? updatedResource : resource
      )
    }));
  };

  const handleRemoveResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // preparar dados para validação
      const dataToValidate = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        resources: formData.resources.filter(resource => resource.resourceType)
      };

      // validar dados
      const validation = validateRoom(dataToValidate);
      
      if (!validation.success) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // chamar serviço apropriado
      let result;
      if (mode === 'create') {
        result = await RoomService.createRoom(validation.data);
      } else {
        result = await RoomService.updateRoom(initialData.id, validation.data);
      }

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
      } else {
        // exibir erros da API
        if (result.error?.details) {
          setErrors(result.error.details);
        } else {
          setErrors({ general: result.error?.message || 'Erro inesperado' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Erro inesperado ao salvar sala' });
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = mode === 'create' ? 'Criar Nova Sala' : 'Editar Sala';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome da Sala"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ex: Sala A101"
            required
            error={errors.name}
          />

          <Input
            label="Localização"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Ex: Bloco A, 1º andar"
            error={errors.location}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Capacidade"
            type="number"
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            placeholder="Ex: 30"
            min="1"
            max="1000"
            required
            error={errors.capacity}
          />

          <Select
            label="Tipo de Sala"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            options={ROOM_TYPES}
            placeholder="Selecione o tipo"
            required
            error={errors.type}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={ROOM_STATUSES}
            required
            error={errors.status}
          />
        </div>

        <Input
          label="Descrição"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Informações adicionais sobre a sala"
          error={errors.description}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Recursos da Sala</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddResource}
            >
              Adicionar Recurso
            </Button>
          </div>

          {formData.resources.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Nenhum recurso adicionado</p>
          ) : (
            <div className="space-y-4">
              {formData.resources.map((resource, index) => (
                <ResourceForm
                  key={index}
                  resource={resource}
                  onChange={(updatedResource) => handleResourceChange(index, updatedResource)}
                  onRemove={() => handleRemoveResource(index)}
                  errors={errors[`resources.${index}`] || {}}
                />
              ))}
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {mode === 'create' ? 'Criar Sala' : 'Salvar Alterações'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default RoomFormModal; 