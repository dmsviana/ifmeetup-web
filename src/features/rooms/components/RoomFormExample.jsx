import { useState } from 'react';
import { Button } from '../../../shared/components/ui';
import RoomFormModal from './RoomFormModal';

const RoomFormExample = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // exemplo de dados para edição
  const sampleRoomData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Sala A101',
    location: 'Bloco A, 1º andar',
    capacity: 30,
    type: 'CLASSROOM',
    status: 'AVAILABLE',
    description: 'Sala de aula com equipamentos multimídia',
    resources: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: 'PROJECTOR',
        quantity: 1,
        details: 'Projetor Full HD'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        resourceType: 'WHITEBOARD',
        quantity: 2,
        details: 'Quadros brancos grandes'
      }
    ]
  };

  const handleCreateSuccess = (newRoom) => {
    console.log('Sala criada com sucesso:', newRoom);
    // aqui você pode atualizar o estado da lista de salas, mostrar notificação, etc.
  };

  const handleEditSuccess = (updatedRoom) => {
    console.log('Sala atualizada com sucesso:', updatedRoom);
    // aqui você pode atualizar o estado da lista de salas, mostrar notificação, etc.
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Exemplo de Uso do Formulário de Sala
      </h2>
      
      <div className="flex gap-4">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Testar Criação de Sala
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setIsEditModalOpen(true)}
        >
          Testar Edição de Sala
        </Button>
      </div>

      {/* Modal de criação */}
      <RoomFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSuccess={handleCreateSuccess}
      />

      {/* Modal de edição */}
      <RoomFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        initialData={sampleRoomData}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default RoomFormExample; 