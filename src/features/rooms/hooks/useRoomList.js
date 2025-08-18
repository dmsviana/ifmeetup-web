import { useState, useEffect, useCallback } from 'react';
import { RoomService } from '../services';

const useRoomList = (filters) => {
  const [state, setState] = useState({
    rooms: [],
    loading: false,
    error: null,
    totalPages: 0,
    totalElements: 0,
    numberOfElements: 0
  });

  // função para carregar salas
  const loadRooms = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let result;
      
      // usar método de busca avançada se houver filtros específicos
      const hasSpecificFilters = filters.search || 
                                 filters.type || 
                                 filters.status || 
                                 filters.minCapacity || 
                                 filters.resourceType;
      
      if (hasSpecificFilters) {
        // converter filtros para o formato esperado pelo service
        const searchFilters = {
          ...filters,
          minCapacity: filters.minCapacity ? parseInt(filters.minCapacity) : undefined,
          resourceQuantity: 1 // quantidade mínima padrão para recursos
        };
        
        result = await RoomService.searchRooms(searchFilters);
      } else {
        // carregar todas as salas com paginação
        result = await RoomService.getAllRooms({
          page: filters.page,
          size: filters.size,
          sort: filters.sort,
          direction: filters.direction
        });
      }

      if (result.success) {
        setState(prev => ({
          ...prev,
          rooms: result.data.content || result.data || [],
          totalPages: result.data.totalPages || 1,
          totalElements: result.data.totalElements || result.data.length || 0,
          numberOfElements: result.data.numberOfElements || result.data.length || 0,
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Erro desconhecido ao carregar salas'
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erro ao carregar salas: ${err.message}`
      }));
    }
  }, [filters]);

  // carregar salas quando os filtros mudarem
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // função para tentar novamente em caso de erro
  const retry = useCallback(() => {
    loadRooms();
  }, [loadRooms]);

  // alias para refetch - mesma funcionalidade que retry
  const refetch = retry;

  return {
    ...state,
    retry,
    refetch
  };
};

export default useRoomList; 