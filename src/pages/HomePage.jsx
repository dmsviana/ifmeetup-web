import React, { useState, useCallback } from 'react';
import { useAuth } from '../features/auth';
import { usePermissions } from '../features/auth/hooks';
import { useDashboardStats } from '../features/dashboard/hooks';
import { StatsGrid, EventsGrid, CreateEventModal, PendingEventsSection } from '../features/dashboard/components';
import { PageHeader } from '../shared/components/layout';
import { Filter, Plus, AlertTriangle } from 'lucide-react';

/**
 * Página principal do dashboard de eventos
 * Exibe estatísticas do sistema e lista de eventos futuros
 */
const HomePage = () => {
  const { hasPermission } = useAuth();
  const permissions = usePermissions();
  
  // estado para controle de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  
  // estado para modal de criação de evento
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // estado para controle de refresh dos eventos
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);
  
  // hooks para dados
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    retry: retryStats
  } = useDashboardStats();

  // verificar permissões para criação de eventos
  const canCreateEvents = hasPermission('EVENT_CREATE') || 
                          hasPermission('ADMIN_ACCESS') || 
                          permissions.isAdmin() || 
                          permissions.isCoordinator();

  // ações do cabeçalho
  const headerActions = [
    // botão de filtros sempre visível
    {
      label: 'Filtros',
      variant: 'secondary',
      onClick: () => setShowFilters(!showFilters),
      icon: <Filter className="w-4 h-4" />
    }
  ];

  // adicionar botão criar evento se tiver permissão
  if (canCreateEvents) {
    headerActions.push({
      label: 'Criar Evento',
      variant: 'primary',
      onClick: () => setShowCreateModal(true),
      icon: <Plus className="w-4 h-4" />
    });
  }

  // handler para ações de eventos
  const handleEventAction = useCallback((eventId, action) => {
    console.log(`Ação ${action} no evento ${eventId}`);
    // ações específicas serão tratadas pelos componentes filhos
  }, []);

  // handler para aplicar filtros
  const handleApplyFilters = useCallback((newFilters) => {
    // remover filtros vazios
    const cleanFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    setActiveFilters(cleanFilters);
    setShowFilters(false);
  }, []);

  // handler para limpar filtros
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setActiveFilters({});
    setShowFilters(false);
  }, []);

  // handler para quando evento é criado
  const handleEventCreated = useCallback((newEvent) => {
    // aqui poderia atualizar a lista de eventos ou mostrar uma mensagem
    console.log('Novo evento criado:', newEvent);
  }, []);

  // handler para quando evento pendente é processado (aprovado/rejeitado)
  const handleEventProcessed = useCallback((eventId, action) => {
    console.log(`Evento ${eventId} foi ${action}`);
    
    // se evento foi aprovado, precisa atualizar a lista de eventos principais
    if (action === 'approved') {
      // forçar refresh da lista de eventos principais incrementando a key
      setEventsRefreshKey(prev => prev + 1);
    }
    
    // atualizar estatísticas também pode ser necessário
    retryStats();
  }, [retryStats]);

  // componente de filtros (implementação básica)
  const FiltersPanel = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evento
              </label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.eventType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value || undefined }))}
              >
                <option value="">Todos os tipos</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="PALESTRA">Palestra</option>
                <option value="CURSO">Curso</option>
                <option value="SEMINARIO">Seminário</option>
                <option value="REUNIAO">Reunião</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value || undefined }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              >
                <option value="">Todos os status</option>
                <option value="APPROVED">Aprovado</option>
                <option value="PENDING">Pendente</option>
                <option value="IN_PROGRESS">Em Andamento</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleApplyFilters(filters)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    );
  };

  // componente de erro para estatísticas
  const StatsErrorBoundary = () => {
    if (!statsError) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Erro ao carregar estatísticas
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {statsError.message || 'Ocorreu um erro inesperado'}
            </p>
          </div>
          {statsError.canRetry && (
            <button
              onClick={retryStats}
              className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho da página */}
      <PageHeader
        title="Bem-vindo ao IFMeetup"
        subtitle="Descubra e participe dos próximos eventos acadêmicos do IFPB"
        actions={headerActions}
      />

      {/* Painel de filtros */}
      <FiltersPanel />

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Seção de estatísticas */}
        <div className="mb-8">
          <StatsErrorBoundary />
          <StatsGrid 
            stats={stats} 
            loading={statsLoading} 
          />
        </div>

        {/* Seção de eventos */}
        <div>
          {/* Indicador de filtros ativos */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">
                  {Object.keys(activeFilters).length} filtro(s) ativo(s)
                </span>
                <div className="flex space-x-1">
                  {Object.entries(activeFilters).map(([key, value]) => (
                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {key === 'eventType' && 'Tipo: '}
                      {key === 'date' && 'Data: '}
                      {key === 'status' && 'Status: '}
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )}
          
          <EventsGrid
            key={eventsRefreshKey} // força refresh quando eventos são aprovados
            onEventAction={handleEventAction}
            className="w-full"
            pageSize={12}
            filters={activeFilters}
          />
        </div>

        {/* Seção de eventos pendentes - visível apenas para usuários com permissão */}
        <PendingEventsSection
          onEventProcessed={handleEventProcessed}
          className="mt-12"
        />
      </div>

      {/* Modal de criação de evento */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default HomePage;