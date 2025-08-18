import { Link } from 'react-router-dom';
import { Button, Card } from '../shared/components/ui';
import { useAuth } from '../features/auth';

const ForbiddenPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <Card.Content className="text-center py-12">
          {/* ícone */}
          <div className="text-6xl mb-6">🚫</div>
          
          {/* título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          
          {/* mensagem */}
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta funcionalidade.
          </p>

          {/* informações do usuário */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">
                👤 Usuário atual:
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Nome:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.roles && user.roles.length > 0 && (
                  <p><strong>Perfis:</strong> {user.roles.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* ações */}
          <div className="space-y-3">
            <Button as={Link} to="/rooms" variant="primary" className="w-full">
              🏠 Voltar ao Início
            </Button>
            
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              🚪 Fazer Logout
            </Button>
          </div>

          {/* informações de contato */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ForbiddenPage; 