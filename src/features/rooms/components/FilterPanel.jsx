import { useState, useEffect } from 'react';
import { Card, Input, Select, Button } from '../../../shared/components/ui';

const FilterPanel = ({ 
  filters = {}, 
  onFiltersChange, 
  onClearFilters,
  isLoading = false 
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    type: '',
    status: '',
    minCapacity: '',
    resourceType: '',
    ...filters
  });

  // sincronizar com filters externos
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, [filters]);

  const handleInputChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    
    // aplicar filtros automaticamente para search
    if (field === 'search') {
      onFiltersChange(newFilters);
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      type: '',
      status: '',
      minCapacity: '',
      resourceType: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  return (
    <Card className="mb-6">
      <Card.Header>
        <Card.Title className="text-lg font-semibold">
          Filtros de Busca
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-4">
          {/* busca por nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nome
            </label>
            <Input
              type="text"
              placeholder="Digite o nome da sala..."
              value={localFilters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Sala
              </label>
              <Select
                value={localFilters.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Todos os tipos</option>
                <option value="CLASSROOM">Sala de Aula</option>
                <option value="LABORATORY">Laboratório</option>
                <option value="AUDITORIUM">Auditório</option>
                <option value="MEETING_ROOM">Sala de Reunião</option>
                <option value="SHARED_SPACE">Espaço Compartilhado</option>
                <option value="OTHER">Outro</option>
              </Select>
            </div>

            {/* filtro por status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={localFilters.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Todos os status</option>
                <option value="AVAILABLE">Disponível</option>
                <option value="OCCUPIED">Ocupada</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="DISABLED">Desabilitada</option>
              </Select>
            </div>

            {/* filtro por capacidade mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidade Mínima
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 10"
                value={localFilters.minCapacity}
                onChange={(e) => handleInputChange('minCapacity', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* filtro por recurso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurso
              </label>
              <Select
                value={localFilters.resourceType}
                onChange={(e) => handleInputChange('resourceType', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Todos os recursos</option>
                <option value="PROJECTOR">Projetor</option>
                <option value="COMPUTER">Computador</option>
                <option value="WHITEBOARD">Quadro Branco</option>
                <option value="SOUND_SYSTEM">Sistema de Som</option>
                <option value="AIR_CONDITIONING">Ar Condicionado</option>
                <option value="WIFI">Wi-Fi</option>
                <option value="OTHER">Outro</option>
              </Select>
            </div>
          </div>
        </div>
      </Card.Content>

      <Card.Footer>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {/* {hasActiveFilters && (
              <span>✨ Filtros ativos aplicados</span>
            )} */}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters || isLoading}
            >
              Limpar Filtros
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default FilterPanel; 