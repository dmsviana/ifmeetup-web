import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge } from '../../../shared/components/ui';
import { usePermissions } from '../../auth/hooks';
import { RoomService } from '../services';
import RoomFormModal from './RoomFormModal';

const RoomCard = ({ room, onRoomUpdated, onRoomDeleted }) => {
  const { canEditRooms, canDeleteRooms } = usePermissions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!room) return null;

  const getRoomTypeDisplay = (type) => {
    const types = {
      CLASSROOM: 'Sala de Aula',
      LABORATORY: 'Laboratório', 
      AUDITORIUM: 'Auditório',
      MEETING_ROOM: 'Sala de Reunião',
      SHARED_SPACE: 'Espaço Compartilhado',
      OTHER: 'Outro'
    };
    return types[type] || type;
  };

  const handleEditSuccess = (updatedRoom) => {
    // notificar componente pai que a sala foi atualizada
    onRoomUpdated?.(updatedRoom);
    console.log('Sala atualizada com sucesso:', updatedRoom);
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleDeleteRoom = async () => {
    // confirmar antes de deletar
    const confirmed = window.confirm(
      `Tem certeza que deseja desabilitar a sala "${room.name}"?\n\nA sala será marcada como DESABILITADA e não estará mais disponível para reservas.`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await RoomService.deleteRoom(room.id);
      
      if (result.success) {
        // notificar componente pai que a sala foi deletada
        onRoomDeleted?.(room.id);
        
        // mostrar mensagem de sucesso
        console.log('Sala desabilitada com sucesso:', room.name);
      } else {
        // mostrar erro
        const errorMessage = result.error?.message || 'Erro ao desabilitar sala';
        alert(`Erro: ${errorMessage}`);
        console.error('Erro ao deletar sala:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar sala:', error);
      alert('Erro inesperado ao desabilitar a sala. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <Card.Header>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Card.Title className="text-lg font-semibold text-gray-900 truncate">
                {room.name}
              </Card.Title>
              {room.location && (
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {room.location}
                </p>
              )}
            </div>
            <StatusBadge 
              status={room.status} 
              className="ml-2 flex-shrink-0" 
            />
          </div>
        </Card.Header>
        
        <Card.Content className="flex-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Capacidade</span>
              <span className="font-medium">{room.capacity} pessoas</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tipo</span>
              <span className="font-medium text-right flex-1 ml-2">
                {getRoomTypeDisplay(room.type)}
              </span>
            </div>

            {room.resources && room.resources.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Recursos: </span>
                <span className="font-medium">
                  {room.resources.length} item{room.resources.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {room.description && (
              <div className="text-sm">
                <p className="text-gray-600 line-clamp-3 leading-relaxed">
                  {room.description}
                </p>
              </div>
            )}
          </div>
        </Card.Content>
        
        <Card.Footer className="mt-auto">
          <div className="flex gap-2">
            <Button 
              as={Link} 
              to={`/rooms/${room.id}`} 
              variant="primary" 
              size="sm"
              className="flex-1"
            >
              Ver Detalhes
            </Button>
            
            {/* botão de editar - só para admins */}
            {canEditRooms() && (
              <Button 
                onClick={handleOpenEditModal}
                variant="outline" 
                size="sm"
                disabled={isDeleting}
              >
                Editar
              </Button>
            )}

            {/* botão de deletar - só para admins */}
            {canDeleteRooms() && room.status !== 'DISABLED' && (
              <Button 
                onClick={handleDeleteRoom}
                variant="outline" 
                size="sm"
                disabled={isDeleting}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
              >
                {isDeleting ? 'Desabilitando...' : 'Excluir'}
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>

      {/* modal de edição */}
      {canEditRooms() && (
        <RoomFormModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          mode="edit"
          initialData={room}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default RoomCard; 