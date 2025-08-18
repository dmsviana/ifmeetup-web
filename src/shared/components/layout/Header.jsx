import { Link, useLocation } from 'react-router-dom';
import { UserMenu } from '../../../features/auth/components';
import { useAuth } from '../../../features/auth';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // não mostrar header na página de login
  if (location.pathname === '/login') {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const linkClasses = (path) => {
    const baseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    return isActive(path)
      ? `${baseClasses} bg-blue-100 text-blue-700`
      : `${baseClasses} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* logo e título */}
          <div className="flex items-center">
            <Link 
              to="/rooms" 
              className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <span className="text-2xl">🏢</span>
              <span>IFMeetup</span>
            </Link>
          </div>

          {/* navegação - só mostrar se autenticado */}
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-1">
              <Link to="/rooms" className={linkClasses('/rooms')}>
                🏠 Salas
              </Link>
              
              <Link to="/availability" className={linkClasses('/availability')}>
                📅 Disponibilidade
              </Link>
            </nav>
          )}

          {/* menu do usuário */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                🔑 Entrar
              </Link>
            )}
          </div>
        </div>

        {/* navegação mobile - só mostrar se autenticado */}
        {isAuthenticated && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <nav className="flex flex-col space-y-1">
              <Link 
                to="/rooms" 
                className={`${linkClasses('/rooms')} text-left`}
              >
                🏠 Salas
              </Link>
              
              <Link 
                to="/availability" 
                className={`${linkClasses('/availability')} text-left`}
              >
                📅 Disponibilidade
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 