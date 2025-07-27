import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Button, Card } from '../components/ui';

const NotFoundPage = () => {
  return (
    <PageContainer>
      <Card className="max-w-2xl mx-auto">
        <Card.Content className="text-center py-12">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button as={Link} to="/" variant="primary">
              🏠 Ir para Início
            </Button>
            <Button as={Link} to="/rooms" variant="outline">
              🏢 Ver Salas
            </Button>
          </div>
        </Card.Content>
      </Card>
    </PageContainer>
  );
};

export default NotFoundPage; 