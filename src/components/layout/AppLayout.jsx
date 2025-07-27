import { Outlet } from 'react-router-dom';
import Header from './Header';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* header fixo */}
      <Header />
      
      {/* conteúdo principal */}
      <main className="pb-8">
        <Outlet />
      </main>
      
      {/* footer (opcional para futuro) */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
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