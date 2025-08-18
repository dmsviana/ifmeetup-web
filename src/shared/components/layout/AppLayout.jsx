import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../../features/auth';

const AppLayout = ({ children, className = '' }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // não mostrar sidebar na página de login
  const showSidebar = isAuthenticated && location.pathname !== '/login';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-blue-50 ${className}`}>
      {showSidebar && (
        <>
          {/* sidebar para desktop */}
          <Sidebar 
            currentPath={location.pathname}
            className="hidden md:block"
          />
          
          {/* sidebar mobile */}
          <Sidebar 
            currentPath={location.pathname}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            className="md:hidden"
          />
          
          {/* botão hamburger para mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* overlay para mobile quando sidebar está aberta */}
          {sidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}
      
      {/* conteúdo principal */}
      <main className={`${showSidebar ? 'md:ml-80' : ''} transition-all duration-300`}>
        <div className="min-h-screen">
          {children || <Outlet />}
        </div>
      </main>
      
      {/* footer */}
      <footer className={`bg-white border-t border-gray-200 ${showSidebar ? 'md:ml-80' : ''} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <p>© 2025 IFPB - Instituto Federal da Paraíba</p>
            <p className="mt-2 sm:mt-0">
              Sistema de Gerenciamento de Eventos - IFMeetup
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout; 