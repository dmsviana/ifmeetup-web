import { Card, Button, Pagination } from '../../../shared/components/ui';
import RoomCard from './RoomCard';
import RoomSkeleton from './RoomSkeleton';

const RoomList = ({
  rooms = [],
  loading = false,
  error = null,
  currentPage = 0,
  totalPages = 0,
  totalElements = 0,
  pageSize = 12,
  onPageChange,
  onRetry,
  onRoomUpdated,
  onRoomDeleted
}) => {
  // estado de loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: pageSize }).map((_, index) => (
          <RoomSkeleton key={index} />
        ))}
      </div>
    );
  }

  // estado de erro
  if (error && !loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <Card.Content className="text-center py-8">
          <div className="text-red-600 text-lg mb-2">Erro ao carregar salas</div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={onRetry} variant="primary">
            Tentar Novamente
          </Button>
        </Card.Content>
      </Card>
    );
  }

  // estado vazio
  if (!loading && !error && rooms.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <Card.Content className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma sala encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            Não encontramos salas que correspondam aos critérios de busca.
          </p>
          <Button onClick={onRetry} variant="outline">
            Recarregar Lista
          </Button>
        </Card.Content>
      </Card>
    );
  }

  // lista de salas
  return (
    <div className="space-y-6">
      {/* grid de salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard 
            key={room.id} 
            room={room} 
            onRoomUpdated={onRoomUpdated} 
            onRoomDeleted={onRoomDeleted}
          />
        ))}
      </div>

      {/* informações de resultados */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 px-1">
          <span>
            Mostrando {rooms.length} de {totalElements} salas
          </span>
          {totalPages > 1 && (
            <span>
              Página {currentPage + 1} de {totalPages}
            </span>
          )}
        </div>
      )}

      {/* paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default RoomList; 