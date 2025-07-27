import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, LoadingSpinner } from '../components/ui';
import { RoomFormModal } from '../components/room';
import { RoomService } from '../services';

const EditRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRoom = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await RoomService.getRoomById(id);
        
        if (result.success) {
          setRoomData(result.data);
        } else {
          setError(result.error?.message || 'Erro ao carregar dados da sala');
        }
      } catch (err) {
        setError('Erro inesperado ao carregar sala');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRoom();
    }
  }, [id]);

  const handleSuccess = (updatedRoom) => {
    // redirecionar para a página de detalhes da sala atualizada
    navigate(`/rooms/${updatedRoom.id}`);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <PageContainer
        title="Editar Sala"
        subtitle="Carregando dados da sala..."
      >
        <Card>
          <Card.Content className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Carregando dados da sala...</p>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        title="Editar Sala"
        subtitle="Erro ao carregar sala"
      >
        <Card>
          <Card.Content className="text-center py-12">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-medium">Erro</p>
              <p>{error}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/rooms')}>
              Voltar para Lista de Salas
            </Button>
          </Card.Content>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Editar Sala"
      subtitle={`Modificando informações da sala: ${roomData?.name}`}
    >
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Formulário de Edição de Sala
          </h3>
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para abrir o formulário de edição da sala.
          </p>
          <Button onClick={handleOpenModal}>
            Editar Sala
          </Button>
        </Card.Content>
      </Card>

      <RoomFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode="edit"
        initialData={roomData}
        onSuccess={handleSuccess}
      />
    </PageContainer>
  );
};

export default EditRoomPage; 