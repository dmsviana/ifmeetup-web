// exportação centralizada dos serviços
export { default as api, handleApiError } from './httpClient';
export { default as RoomService } from './roomService';
export { default as EventService } from './eventService';
export { default as EventParticipationService } from './eventParticipationService';
export { default as ParticipationToastService, createParticipationToastService, PARTICIPATION_TOAST_MESSAGES, TOAST_TYPES, TOAST_DURATIONS } from './participationToastService';