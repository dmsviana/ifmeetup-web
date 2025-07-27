import { Card } from '../ui';

const RoomSkeleton = () => {
  return (
    <Card className="h-full flex flex-col animate-pulse">
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-300 rounded-full ml-2"></div>
        </div>
      </Card.Header>
      
      <Card.Content className="flex-1">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
          
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-28"></div>
          </div>

          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-4/5"></div>
            <div className="h-4 bg-gray-300 rounded w-3/5"></div>
          </div>
        </div>
      </Card.Content>
      
      <Card.Footer className="mt-auto">
        <div className="flex gap-2">
          <div className="h-8 bg-gray-300 rounded flex-1"></div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default RoomSkeleton; 