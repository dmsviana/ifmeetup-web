import { useState } from 'react';
import { PageContainer } from '../components/layout';
import { Button } from '../components/ui';
import { RoomList, FilterPanel, RoomFormModal } from '../components/room';
import { useRoomFilters, useRoomList } from '../hooks';
import { usePermissions } from '../auth';

const RoomsPage = () => {
  const { canCreateRooms } = usePermissions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // gerenciar filtros e sincronização com URL
  const { 
    filters, 
    updateFilters, 
    clearFilters, 
    changePage, 
    hasActiveFilters 
  } = useRoomFilters();
  
  // gerenciar carregamento da lista de salas
  const { 
    rooms, 
    loading, 
    error, 
    totalPages, 
    totalElements, 
    numberOfElements, 
    retry,
    refetch
  } = useRoomList(filters);

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handlePageChange = (newPage) => {
    changePage(newPage);
  };

  const handleRetry = () => {
    retry();
  };

  const handleCreateSuccess = (newRoom) => {
    // recarregar a lista de salas para mostrar a nova sala
    refetch();
    console.log('Sala criada com sucesso:', newRoom);
  };

  const handleRoomDeleted = (roomId) => {
    // recarregar a lista de salas para remover a sala deletada
    refetch();
    console.log('Sala deletada com sucesso:', roomId);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <PageContainer
      title="Gerenciamento de Salas"
      subtitle={
        hasActiveFilters 
          ? `${numberOfElements} sala${numberOfElements !== 1 ? 's' : ''} encontrada${numberOfElements !== 1 ? 's' : ''} com os filtros aplicados`
          : "Visualize e gerencie todas as salas do instituto"
      }
      actions={
        // só mostrar botão de criar sala para admins
        canCreateRooms() ? (
          <Button onClick={handleOpenCreateModal} variant="primary">
            Nova Sala
          </Button>
        ) : null
      }
    >
      {/* painel de filtros */}
      {/* <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isLoading={loading}
      /> */}

      {/* lista de salas */}
      <RoomList
        rooms={rooms}
        loading={loading}
        error={error}
        currentPage={filters.page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={filters.size}
        onPageChange={handlePageChange}
        onRetry={handleRetry}
        onRoomUpdated={refetch}
        onRoomDeleted={handleRoomDeleted}
      />

      {/* modal de criação de sala */}
      <RoomFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        mode="create"
        onSuccess={handleCreateSuccess}
      />
    </PageContainer>
  );
};

export default RoomsPage; 