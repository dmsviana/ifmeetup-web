import { Link } from 'react-router-dom';
import { CalendarCheck, DoorOpen, Users, Settings, UserCircle } from 'lucide-react';

// mapeamento de ícones
const iconMap = {
  'calendar-check': <CalendarCheck className="w-5 h-5" />,
  'door-open': <DoorOpen className="w-5 h-5" />,
  'users': <Users className="w-5 h-5" />,
  'cog': <Settings className="w-5 h-5" />,
  'user-circle': <UserCircle className="w-5 h-5" />,
};

const SidebarNav = ({ navigationItems, currentPath }) => {
  // verificar se rota está ativa
  const isActive = (path) => {
    if (path === '/home') {
      return currentPath === '/' || currentPath === '/home';
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // classes para links
  const getLinkClasses = (path) => {
    const baseClasses = "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group";
    
    if (isActive(path)) {
      return `${baseClasses} bg-green-50 text-green-700 border-r-2 border-green-600`;
    }
    
    return `${baseClasses} text-gray-600 hover:text-green-600 hover:bg-green-50`;
  };

  return (
    <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
      {navigationItems.map((section) => (
        <div key={section.section}>
          {/* título da seção */}
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {section.section}
          </h3>
          
          {/* itens da seção */}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={getLinkClasses(item.path)}
                  title={item.description}
                >
                  {/* ícone */}
                  <span className={`${isActive(item.path) ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500'} transition-colors`}>
                    {iconMap[item.icon] || iconMap['cog']}
                  </span>
                  
                  {/* label */}
                  <span className="flex-1">{item.label}</span>
                  
                  {/* indicador ativo */}
                  {isActive(item.path) && (
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default SidebarNav;