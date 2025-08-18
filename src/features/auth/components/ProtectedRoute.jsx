import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../../../shared/components/ui';

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null, 
  requiredRole = null,
  fallbackPath = '/forbidden'
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasPermission, 
    hasRole 
  } = useAuth();
  const location = useLocation();

  // ainda carregando estado de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // não autenticado - redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // verificar permissão específica se fornecida
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // verificar role específica se fornecida
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // autenticado e autorizado - renderizar componente
  return children;
};

export default ProtectedRoute; 