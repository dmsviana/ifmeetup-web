import { Link } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

const Sidebar = ({ currentPath, isOpen = true, onClose, className = '' }) => {
  const { hasPermission } = useAuth();

  // definir itens de navegação
  const navigationItems = [
    {
      section: 'Principal',
      items: [
        { 
          path: '/home', 
          label: 'Eventos', 
          icon: 'calendar-check',
          description: 'Dashboard de eventos'
        },
        { 
          path: '/rooms', 
          label: 'Salas', 
          icon: 'door-open',
          description: 'Gerenciamento de salas'
        },
        { 
          path: '/users', 
          label: 'Usuários', 
          icon: 'users',
          description: 'Gerenciamento de usuários',
          requiresPermission: 'ADMIN_ACCESS'
        }
      ]
    },
    {
      section: 'Sistema',
      items: [
        { 
          path: '/settings', 
          label: 'Configuração', 
          icon: 'cog',
          description: 'Configurações do sistema'
        },
        { 
          path: '/profile', 
          label: 'Perfil', 
          icon: 'user-circle',
          description: 'Meu perfil'
        }
      ]
    }
  ];

  // filtrar itens baseado em permissões
  const filteredNavigationItems = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.requiresPermission || hasPermission(item.requiresPermission)
    )
  }));

  // classes para sidebar baseado no estado
  const sidebarClasses = `
    fixed top-0 left-0 h-full w-80 bg-white shadow-xl border-r border-gray-200 z-40
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${className}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* header da sidebar */}
        <SidebarHeader onClose={onClose} />
        
        {/* navegação principal */}
        <SidebarNav 
          navigationItems={filteredNavigationItems}
          currentPath={currentPath}
        />
        
        {/* footer com perfil do usuário */}
        <SidebarFooter />
      </div>
    </aside>
  );
};

export default Sidebar;