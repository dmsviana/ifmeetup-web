import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../shared/components/layout';
import { Card, Button } from '../shared/components/ui';
import { RoomFormModal } from '../features/rooms/components';

const NewRoomPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (newRoom) => {
    // redirecionar para a página de detalhes da sala criada
    navigate(`/rooms/${newRoom.id}`);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <PageContainer
      title="Criar Nova Sala"
      subtitle="Adicione uma nova sala ao sistema"
    >
      <Card>
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Formulário de Criação de Sala
          </h3>
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para abrir o formulário de criação de sala.
          </p>
          <Button onClick={handleOpenModal}>
            Criar Nova Sala
          </Button>
        </Card.Content>
      </Card>

      <RoomFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode="create"
        onSuccess={handleSuccess}
      />
    </PageContainer>
  );
};

export default NewRoomPage; 