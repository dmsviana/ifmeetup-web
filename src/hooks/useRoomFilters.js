import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const useRoomFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // estado dos filtros
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    minCapacity: searchParams.get('minCapacity') || '',
    resourceType: searchParams.get('resourceType') || '',
    page: parseInt(searchParams.get('page')) || 0,
    size: parseInt(searchParams.get('size')) || 12,
    sort: searchParams.get('sort') || 'name',
    direction: searchParams.get('direction') || 'ASC'
  });

  // sincronizar filtros com URL
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    setSearchParams(params);
  }, [setSearchParams]);

  // atualizar filtros
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 0 // resetar página ao alterar filtros
    };
    
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  }, [filters, updateURL]);

  // limpar filtros
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      type: '',
      status: '',
      minCapacity: '',
      resourceType: '',
      page: 0,
      size: filters.size,
      sort: filters.sort,
      direction: filters.direction
    };
    
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  }, [filters.size, filters.sort, filters.direction, updateURL]);

  // alterar página
  const changePage = useCallback((newPage) => {
    const updatedFilters = {
      ...filters,
      page: newPage
    };
    
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  }, [filters, updateURL]);

  // sincronizar com mudanças na URL (voltar/avançar do navegador)
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      minCapacity: searchParams.get('minCapacity') || '',
      resourceType: searchParams.get('resourceType') || '',
      page: parseInt(searchParams.get('page')) || 0,
      size: parseInt(searchParams.get('size')) || 12,
      sort: searchParams.get('sort') || 'name',
      direction: searchParams.get('direction') || 'ASC'
    };
    
    setFilters(urlFilters);
  }, [searchParams]);

  // verificar se há filtros ativos
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type ||
    filters.status ||
    filters.minCapacity ||
    filters.resourceType
  );

  return {
    filters,
    updateFilters,
    clearFilters,
    changePage,
    hasActiveFilters
  };
};

export default useRoomFilters; 