// exportação centralizada dos schemas e validadores
export { RoomSchema, RoomRequestSchema, RoomResponseSchema, PageRoomResponseSchema, RoomStatusRequestSchema } from './roomSchema';
export { LoginSchema, LoginResponseSchema, UserSchema, SuapLoginSchema } from './authSchema';

// enums
export {
  RoomTypeEnum,
  RoomStatusEnum,
  ResourceTypeEnum,
} from './roomSchema';

// validadores
export {
  validateRoom,
  validateResource,
  validateRoomStatus,
} from './roomSchema';

// constants
export {
  ROOM_TYPES,
  ROOM_STATUSES,
  RESOURCE_TYPES
} from './roomSchema'; 