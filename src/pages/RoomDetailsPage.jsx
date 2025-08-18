import { useParams } from 'react-router-dom';
import { PageContainer } from '../shared/components/layout';
import { Card } from '../shared/components/ui';

const RoomDetailsPage = () => {
  const { id } = useParams();

  return (
    <PageContainer
      title="Detalhes da Sala"
      subtitle={`Visualizando informações da sala ${id}`}
    >
      <Card>
        <Card.Content className="text-center py-12">
          <div className="text-6xl mb-4">👁️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Detalhes da Sala
          </h3>
          <p className="text-gray-600">
            A visualização completa dos detalhes será implementada na próxima task.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ID da sala: {id}
          </p>
        </Card.Content>
      </Card>
    </PageContainer>
  );
};

export default RoomDetailsPage; 