// exportação centralizada dos schemas e validadores
export { RoomSchema, RoomRequestSchema, RoomResponseSchema, PageRoomResponseSchema, RoomStatusRequestSchema } from './roomSchema.js';
export { LoginSchema, LoginResponseSchema, UserSchema, SuapLoginSchema } from './authSchema.js';
export { 
  EventSchema, 
  EventCreateRequestSchema, 
  EventUpdateRequestSchema, 
  EventResponseSchema, 
  PageEventResponseSchema,
  EventRejectRequestSchema,
  DashboardStatsSchema,
  EventDisplayDataSchema,
  // participation schemas
  EventParticipantResponseSchema,
  EventParticipantFullSchema,
  ParticipationStatusSchema,
  ParticipantsCountResponseSchema,
  RegistrationCheckResponseSchema,
  AttendanceUpdateRequestSchema,
  EventParticipantsListResponseSchema,
  EventRegistrationResponseSchema,
  EventCancellationResponseSchema,
  BulkParticipationStatusSchema,
  UserEventsResponseSchema,
  FeedbackRequestSchema
} from './eventSchema.js';

// enums
export {
  RoomTypeEnum,
  RoomStatusEnum,
  ResourceTypeEnum,
} from './roomSchema.js';

export {
  EventTypeEnum,
  EventStatusEnum,
  AttendanceStatusEnum
} from './eventSchema.js';

// validadores
export {
  validateRoom,
  validateResource,
  validateRoomStatus,
} from './roomSchema.js';

export {
  validateEventCreate,
  validateEventUpdate,
  validateEventReject,
  // participation validators
  validateFeedback,
  validateAttendanceUpdate,
  validateParticipationResponse,
  validateBulkParticipationStatus
} from './eventSchema.js';

// constants
export {
  ROOM_TYPES,
  ROOM_STATUSES,
  RESOURCE_TYPES
} from './roomSchema.js';

export {
  EVENT_TYPES,
  EVENT_STATUSES,
  ATTENDANCE_STATUSES
} from './eventSchema.js';

// helpers
export {
  getEventTypeIcon,
  getEventTypeLabel,
  getEventStatusColor,
  getEventStatusLabel,
  formatEventDate,
  formatEventTime,
  isFutureEvent,
  isEventInProgress,
  // participation helpers
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  canUserRegister,
  canUserCancelRegistration,
  isEventFull,
  getAvailableSpots,
  formatParticipantsCount,
  getParticipationDisplayStatus
} from './eventSchema.js'; 