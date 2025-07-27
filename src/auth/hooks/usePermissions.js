import { useAuth } from '../context/AuthContext';

// hook para facilitar verificação de permissões relacionadas a salas
const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth();

  // permissões relacionadas a salas
  const roomPermissions = {
    // permissões gerais
    canViewAllRooms: () => hasPermission('ROOM_VIEW_ALL') || hasPermission('ADMIN_ACCESS'),
    canViewAvailability: () => hasPermission('ROOM_VIEW_AVAILABILITY') || hasPermission('ROOM_VIEW_ALL') || hasPermission('ADMIN_ACCESS'),
    canReserveRooms: () => hasPermission('ROOM_RESERVE'),
    
    // permissões administrativas
    canCreateRooms: () => hasPermission('ADMIN_ACCESS'),
    canEditRooms: () => hasPermission('ADMIN_ACCESS'),
    canDeleteRooms: () => hasPermission('ADMIN_ACCESS'),
    canManageReservations: () => hasPermission('ROOM_MANAGE_RESERVATIONS') || hasPermission('ADMIN_ACCESS'),
    
    // permissões de status
    canChangeStatus: () => hasPermission('ADMIN_ACCESS'),
    canDisableRooms: () => hasPermission('ADMIN_ACCESS'),
    
    // verificação por role
    isAdmin: () => hasRole('ADMIN'),
    isCoordinator: () => hasRole('COORDINATOR'),
    isTeacher: () => hasRole('TEACHER'),
    isStudent: () => hasRole('STUDENT'),
    
    // verificação combinada
    canManageRooms: () => hasPermission('ADMIN_ACCESS'),
    hasAdminAccess: () => hasPermission('ADMIN_ACCESS')
  };

  return {
    ...roomPermissions,
    user,
    // funções base do contexto
    hasPermission,
    hasRole
  };
};

export default usePermissions; 