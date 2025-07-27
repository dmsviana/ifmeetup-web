import { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  LoadingSpinner, 
  Card, 
  StatusBadge, 
  Select, 
  Modal,
  Pagination 
} from './components/ui';
import { RoomService } from './services';
import { ROOM_TYPES, ROOM_STATUSES, RESOURCE_TYPES, validateRoom } from './schemas';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg"></div>
              <h1 className="text-xl font-bold text-gray-900">
                IFMeetup - Sistema de Salas
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <StatusBadge status="AVAILABLE" />
              <span className="text-sm text-gray-600">Task 4 - Layout & Navigation ✅</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* aviso sobre layout implementado */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <Card.Header>
            <Card.Title className="text-green-700">
              🚀 Task 4 - Layout & Navigation Concluída!
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4 text-green-800">
              <p className="font-medium">
                O sistema de layout e navegação foi implementado com sucesso! 
              </p>
              <p>
                Para visualizar a aplicação completa, acesse:{' '}
                <strong>http://localhost:5173</strong>
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">
                  Funcionalidades Implementadas:
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>✅ <strong>AppLayout</strong> - Layout principal responsivo</li>
                  <li>✅ <strong>Header</strong> - Navegação com branding IFPB</li>
                  <li>✅ <strong>PageContainer</strong> - Container consistente</li>
                  <li>✅ <strong>React Router v6</strong> - Sistema de rotas</li>
                  <li>✅ <strong>Páginas Base</strong> - Estrutura completa</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* estrutura implementada */}
        <Card className="mb-8">
          <Card.Header>
            <Card.Title className="text-blue-600">Arquitetura de Layout Implementada</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Componentes de Layout</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><strong>Header</strong> - Navegação responsiva com menu mobile</li>
                  <li><strong>AppLayout</strong> - Layout principal com Outlet</li>
                  <li><strong>PageContainer</strong> - Container consistente para páginas</li>
                  <li>Design IFPB com cores institucionais</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sistema de Rotas</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><code>/</code> - Redirect para /rooms</li>
                  <li><code>/rooms</code> - Lista de salas</li>
                  <li><code>/rooms/new</code> - Criar sala</li>
                  <li><code>/rooms/:id</code> - Detalhes da sala</li>
                  <li><code>/rooms/:id/edit</code> - Editar sala</li>
                  <li><code>/availability</code> - Verificar disponibilidade</li>
                  <li><code>/*</code> - Página 404</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* próximos passos */}
        <Card className="border-dashed border-2 border-blue-300">
          <Card.Content className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Navegue pela Aplicação!
            </h3>
            <p className="text-gray-600 mb-6">
              O sistema de layout e navegação está pronto. Acesse as diferentes páginas 
              através do menu de navegação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                as="a" 
                href="http://localhost:5173/rooms" 
                target="_blank"
                variant="primary"
              >
                🏢 Ver Lista de Salas
              </Button>
              <Button 
                as="a" 
                href="http://localhost:5173/rooms/new" 
                target="_blank"
                variant="outline"
              >
                ➕ Criar Nova Sala
              </Button>
              <Button 
                as="a" 
                href="http://localhost:5173/availability" 
                target="_blank"
                variant="outline"
              >
                📅 Verificar Disponibilidade
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* status do projeto */}
        <Card className="mt-8">
          <Card.Header>
            <Card.Title className="text-green-600">Status do Projeto IFMeetup</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-green-700">Task 1</div>
                <div className="text-xs text-green-600">Fundação</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-green-700">Task 2</div>
                <div className="text-xs text-green-600">UI Components</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-green-700">Task 3</div>
                <div className="text-xs text-green-600">API Services</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium text-green-700">Task 4</div>
                <div className="text-xs text-green-600">Layout & Navigation</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">
                Próxima Task: Room Listing Functionality
              </p>
              <p className="text-gray-600">
                Implementação completa da listagem de salas com filtros e paginação
              </p>
            </div>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
};

export default App;
