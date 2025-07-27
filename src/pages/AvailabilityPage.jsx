import { PageContainer } from '../components/layout';
import { Card } from '../components/ui';

const AvailabilityPage = () => {
  return (
    <PageContainer
      title="Verificar Disponibilidade"
      subtitle="Encontre salas disponíveis para o período desejado"
    >
      <Card>
        <Card.Content className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Verificação de Disponibilidade
          </h3>
          <p className="text-gray-600">
            O sistema de verificação de disponibilidade será implementado nas próximas tasks.
          </p>
        </Card.Content>
      </Card>
    </PageContainer>
  );
};

export default AvailabilityPage; 