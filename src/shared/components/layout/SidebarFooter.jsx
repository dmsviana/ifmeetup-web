import { useState } from 'react';
import { useAuth } from '../../../features/auth';

const SidebarFooter = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) {
    return null;
  }

  // gerar avatar baseado nas iniciais
  const getInitials = (name) => {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // determinar tipo de perfil baseado em roles/permissions
  const getUserRole = () => {
    if (user.roles?.includes('ADMIN')) return 'Administrador';
    if (user.roles?.includes('COORDINATOR')) return 'Coordenador';
    if (user.roles?.includes('TEACHER')) return 'Professor';
    if (user.roles?.includes('STUDENT')) return 'Estudante';
    return 'Usuário';
  };

  // cores do avatar baseado no tipo de usuário
  const getAvatarColors = () => {
    const role = getUserRole();
    switch (role) {
      case 'Administrador':
        return 'bg-red-500 text-white';
      case 'Coordenador':
        return 'bg-blue-500 text-white';
      case 'Professor':
        return 'bg-green-500 text-white';
      case 'Estudante':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="relative">
        {/* perfil do usuário */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          {/* avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColors()}`}>
            {getInitials(user.name || user.username)}
          </div>
          
          {/* informações do usuário */}
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {getUserRole()}
            </p>
          </div>
          
          {/* ícone dropdown */}
          <svg 
            className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* dropdown menu */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* informações detalhadas */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user.name || user.username}
              </p>
              <p className="text-xs text-gray-500">
                {user.email}
              </p>
              <p className="text-xs text-green-600 font-medium">
                {getUserRole()}
              </p>
            </div>
            
            {/* ações */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // navegar para perfil quando implementado
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Meu Perfil</span>
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // navegar para configurações quando implementado
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Configurações</span>
              </button>
              
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* overlay para fechar dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default SidebarFooter;