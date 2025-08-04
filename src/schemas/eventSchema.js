import { z } from 'zod';

// enum para status de participação
export const AttendanceStatusEnum = z.enum([
  'REGISTERED',
  'PRESENT', 
  'ABSENT',
  'CANCELED'
]);

// enum para tipos de evento
export const EventTypeEnum = z.enum([
  'COURSE',
  'WORKSHOP',
  'LECTURE',
  'MEETING',
  'SEMINAR',
  'MINICOURSE',
  'OTHER'
]);

// enum para status do evento
export const EventStatusEnum = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELED_BY_ORGANIZER',
  'CANCELED_BY_ADMIN',
  'CONCLUDED',
  'IN_PROGRESS'
]);

// schema para usuário (usado em organizer e approvedBy)
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional()
});

// schema para sala (usado em room) - flexível para API
export const RoomResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional()
});

// schema principal do evento
export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(150, 'Título deve ter no máximo 150 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória'),
  organizer: UserResponseSchema.optional(),
  room: RoomResponseSchema.optional(),
  roomId: z.string().uuid().optional(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  maxParticipants: z.number().min(1, 'Deve ter pelo menos 1 participante'),
  status: EventStatusEnum,
  eventType: EventTypeEnum,
  publicEvent: z.boolean().default(true),
  approvedBy: UserResponseSchema.optional(),
  approvalDateTime: z.string().optional(),
  rejectionReason: z.string().optional(),
  currentParticipants: z.number().min(0).optional()
});

// schema base para request de evento (sem refinements)
const BaseEventRequestSchema = z.object({
  title: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(150, 'Título deve ter no máximo 150 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória'),
  roomId: z.string().uuid('ID da sala deve ser um UUID válido'),
  startDateTime: z.string().min(1, 'Data/hora de início é obrigatória'),
  endDateTime: z.string().min(1, 'Data/hora de fim é obrigatória'),
  maxParticipants: z.number().min(1, 'Deve ter pelo menos 1 participante'),
  eventType: EventTypeEnum,
  publicEvent: z.boolean().default(true)
});

// schema para request de criação de evento
export const EventCreateRequestSchema = BaseEventRequestSchema.refine(
  (data) => new Date(data.endDateTime) > new Date(data.startDateTime),
  {
    message: 'Data/hora de fim deve ser posterior à data/hora de início',
    path: ['endDateTime']
  }
);

// schema para request de atualização de evento
export const EventUpdateRequestSchema = BaseEventRequestSchema.extend({
  status: EventStatusEnum,
  rejectionReason: z.string().optional()
}).refine(
  (data) => new Date(data.endDateTime) > new Date(data.startDateTime),
  {
    message: 'Data/hora de fim deve ser posterior à data/hora de início',
    path: ['endDateTime']
  }
).refine(
  (data) => {
    if (data.status === 'REJECTED' && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Motivo da rejeição é obrigatório quando status é REJECTED',
    path: ['rejectionReason']
  }
);

// schema para response de evento - compatível com API real
export const EventResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  organizer: UserResponseSchema,
  room: RoomResponseSchema,
  startDateTime: z.string(),
  endDateTime: z.string(),
  maxParticipants: z.number(),
  status: EventStatusEnum,
  eventType: EventTypeEnum,
  publicEvent: z.boolean(),
  approvedBy: UserResponseSchema.optional(),
  approvalDateTime: z.string().optional(),
  rejectionReason: z.string().optional(),
  currentParticipants: z.number().min(0).default(0)
});

// schema para request de rejeição
export const EventRejectRequestSchema = z.object({
  rejectionReason: z.string()
    .min(10, 'Motivo deve ter pelo menos 10 caracteres')
    .max(500, 'Motivo deve ter no máximo 500 caracteres')
});

// schema para resposta de lista paginada
export const PageEventResponseSchema = z.object({
  content: z.array(EventResponseSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
  first: z.boolean(),
  last: z.boolean(),
  numberOfElements: z.number(),
  empty: z.boolean(),
  // campos adicionais que podem vir da API
  pageable: z.any().optional(),
  sort: z.any().optional()
});

// schema para estatísticas do dashboard
export const DashboardStatsSchema = z.object({
  activeEvents: z.number().min(0),
  totalParticipants: z.number().min(0),
  availableRooms: z.number().min(0),
  ongoingEvents: z.number().min(0)
});

// schema para participante de evento
export const EventParticipantResponseSchema = z.object({
  id: z.string().uuid(),
  event: z.object({
    id: z.string().uuid(),
    title: z.string()
  }),
  user: UserResponseSchema,
  registrationDateTime: z.string(),
  attendanceStatus: AttendanceStatusEnum,
  certificateIssued: z.boolean(),
  feedback: z.string().optional()
});

// schema para participante completo (com dados do evento)
export const EventParticipantFullSchema = z.object({
  id: z.string().uuid(),
  user: UserResponseSchema,
  event: EventResponseSchema,
  registrationDateTime: z.string(),
  attendanceStatus: AttendanceStatusEnum,
  certificateIssued: z.boolean(),
  feedback: z.string().optional()
});

// schema para request de feedback
export const FeedbackRequestSchema = z.object({
  feedback: z.string()
    .min(10, 'Feedback deve ter pelo menos 10 caracteres')
    .max(1000, 'Feedback deve ter no máximo 1000 caracteres')
});

// schema para status de participação
export const ParticipationStatusSchema = z.object({
  eventId: z.string().uuid(),
  isRegistered: z.boolean(),
  canRegister: z.boolean(),
  participantsCount: z.number().min(0),
  maxParticipants: z.number().min(1).optional(),
  registrationDate: z.string().optional(),
  attendanceStatus: AttendanceStatusEnum.optional(),
  lastUpdated: z.string()
});

// schema para resposta de contagem de participantes
export const ParticipantsCountResponseSchema = z.object({
  count: z.number().min(0),
  maxParticipants: z.number().min(1),
  isFull: z.boolean(),
  availableSpots: z.number().min(0)
});

// schema para resposta de verificação de inscrição
export const RegistrationCheckResponseSchema = z.object({
  isRegistered: z.boolean(),
  registrationDateTime: z.string().optional(),
  attendanceStatus: AttendanceStatusEnum.optional(),
  canCancel: z.boolean().default(true)
});

// schema para request de atualização de status de presença
export const AttendanceUpdateRequestSchema = z.object({
  userId: z.string().uuid('ID do usuário deve ser um UUID válido'),
  attendanceStatus: AttendanceStatusEnum
});

// schema para resposta de lista de participantes
export const EventParticipantsListResponseSchema = z.object({
  participants: z.array(EventParticipantResponseSchema),
  totalCount: z.number().min(0),
  presentCount: z.number().min(0),
  absentCount: z.number().min(0),
  registeredCount: z.number().min(0)
});

// schema para resposta de inscrição em evento
export const EventRegistrationResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  registrationDateTime: z.string(),
  attendanceStatus: AttendanceStatusEnum.default('REGISTERED'),
  message: z.string().optional()
});

// schema para resposta de cancelamento de inscrição
export const EventCancellationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  cancellationDateTime: z.string()
});

// schema para bulk status check (múltiplos eventos)
export const BulkParticipationStatusSchema = z.object({
  statuses: z.array(ParticipationStatusSchema),
  lastUpdated: z.string()
});

// schema para eventos do usuário
export const UserEventsResponseSchema = z.object({
  registeredEvents: z.array(EventParticipantFullSchema),
  organizedEvents: z.array(EventResponseSchema),
  totalRegistered: z.number().min(0),
  totalOrganized: z.number().min(0)
});

// schema para dados de evento formatados para exibição
export const EventDisplayDataSchema = EventResponseSchema.extend({
  formattedDate: z.string(),
  formattedTime: z.string(),
  categoryIcon: z.string(),
  isSubscribed: z.boolean().default(false),
  canSubscribe: z.boolean().default(true)
});

// helpers de validação para formulários
export const validateEventCreate = (data) => {
  try {
    return {
      success: true,
      data: EventCreateRequestSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateEventUpdate = (data) => {
  try {
    return {
      success: true,
      data: EventUpdateRequestSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateEventReject = (data) => {
  try {
    return {
      success: true,
      data: EventRejectRequestSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {})
    };
  }
};

// helpers de validação para participação
export const validateFeedback = (data) => {
  try {
    return {
      success: true,
      data: FeedbackRequestSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateAttendanceUpdate = (data) => {
  try {
    return {
      success: true,
      data: AttendanceUpdateRequestSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {})
    };
  }
};

// helper para validar resposta de API de participação
export const validateParticipationResponse = (data, schema) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      errors: null
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      success: false,
      data: null,
      errors: error.errors
    };
  }
};

// helper para validar múltiplos status de participação
export const validateBulkParticipationStatus = (data) => {
  try {
    return {
      success: true,
      data: BulkParticipationStatusSchema.parse(data),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors
    };
  }
};

// constants para uso em componentes
export const EVENT_TYPES = [
  { value: 'COURSE', label: 'Curso', icon: 'academic-cap' },
  { value: 'WORKSHOP', label: 'Workshop', icon: 'wrench-screwdriver' },
  { value: 'LECTURE', label: 'Palestra', icon: 'microphone' },
  { value: 'MEETING', label: 'Reunião', icon: 'users' },
  { value: 'SEMINAR', label: 'Seminário', icon: 'presentation-chart-line' },
  { value: 'MINICOURSE', label: 'Minicurso', icon: 'book-open' },
  { value: 'OTHER', label: 'Outro', icon: 'ellipsis-horizontal' }
];

export const EVENT_STATUSES = [
  { value: 'PENDING_APPROVAL', label: 'Aguardando Aprovação', color: 'yellow' },
  { value: 'APPROVED', label: 'Aprovado', color: 'green' },
  { value: 'REJECTED', label: 'Rejeitado', color: 'red' },
  { value: 'CANCELED_BY_ORGANIZER', label: 'Cancelado pelo Organizador', color: 'gray' },
  { value: 'CANCELED_BY_ADMIN', label: 'Cancelado pelo Admin', color: 'gray' },
  { value: 'CONCLUDED', label: 'Concluído', color: 'blue' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'purple' }
];

// helper para obter ícone do tipo de evento
export const getEventTypeIcon = (eventType) => {
  const type = EVENT_TYPES.find(t => t.value === eventType);
  return type?.icon || 'calendar';
};

// helper para obter label do tipo de evento
export const getEventTypeLabel = (eventType) => {
  const type = EVENT_TYPES.find(t => t.value === eventType);
  return type?.label || eventType;
};

// helper para obter cor do status
export const getEventStatusColor = (status) => {
  const statusObj = EVENT_STATUSES.find(s => s.value === status);
  return statusObj?.color || 'gray';
};

// helper para obter label do status
export const getEventStatusLabel = (status) => {
  const statusObj = EVENT_STATUSES.find(s => s.value === status);
  return statusObj?.label || status;
};

// helper para formatar data para exibição
export const formatEventDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).toUpperCase();
};

// helper para formatar horário para exibição
export const formatEventTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// helper para verificar se evento é futuro
export const isFutureEvent = (startDateTime) => {
  return new Date(startDateTime) > new Date();
};

// helper para verificar se evento está em andamento
export const isEventInProgress = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  return now >= start && now <= end;
};

// constants para status de participação
export const ATTENDANCE_STATUSES = [
  { value: 'REGISTERED', label: 'Inscrito', color: 'blue' },
  { value: 'PRESENT', label: 'Presente', color: 'green' },
  { value: 'ABSENT', label: 'Ausente', color: 'red' },
  { value: 'CANCELED', label: 'Cancelado', color: 'gray' }
];

// helper para obter label do status de presença
export const getAttendanceStatusLabel = (status) => {
  const statusObj = ATTENDANCE_STATUSES.find(s => s.value === status);
  return statusObj?.label || status;
};

// helper para obter cor do status de presença
export const getAttendanceStatusColor = (status) => {
  const statusObj = ATTENDANCE_STATUSES.find(s => s.value === status);
  return statusObj?.color || 'gray';
};

// helper para verificar se usuário pode se inscrever
export const canUserRegister = (event, participantsCount, isRegistered) => {
  if (isRegistered) return false;
  if (event.status !== 'APPROVED') return false;
  if (new Date(event.startDateTime) <= new Date()) return false;
  if (participantsCount >= event.maxParticipants) return false;
  return true;
};

// helper para verificar se usuário pode cancelar inscrição
export const canUserCancelRegistration = (event, isRegistered) => {
  if (!isRegistered) return false;
  if (event.status !== 'APPROVED') return false;
  // permite cancelar até 1 hora antes do evento
  const oneHourBefore = new Date(event.startDateTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  if (new Date() >= oneHourBefore) return false;
  return true;
};

// helper para verificar se evento está lotado
export const isEventFull = (participantsCount, maxParticipants) => {
  return participantsCount >= maxParticipants;
};

// helper para calcular vagas disponíveis
export const getAvailableSpots = (participantsCount, maxParticipants) => {
  return Math.max(0, maxParticipants - participantsCount);
};

// helper para formatar contagem de participantes
export const formatParticipantsCount = (current, max) => {
  return `${current}/${max} participantes`;
};

// helper para determinar status de participação para exibição
export const getParticipationDisplayStatus = (event, participantsCount, isRegistered) => {
  if (isRegistered) {
    return {
      status: 'registered',
      label: 'Inscrito',
      color: 'green',
      canAct: canUserCancelRegistration(event, isRegistered)
    };
  }

  if (event.status !== 'APPROVED') {
    return {
      status: 'unavailable',
      label: 'Indisponível',
      color: 'gray',
      canAct: false
    };
  }

  if (new Date(event.startDateTime) <= new Date()) {
    return {
      status: 'closed',
      label: 'Encerrado',
      color: 'gray',
      canAct: false
    };
  }

  if (isEventFull(participantsCount, event.maxParticipants)) {
    return {
      status: 'full',
      label: 'Lotado',
      color: 'red',
      canAct: false
    };
  }

  return {
    status: 'available',
    label: 'Inscrever-se',
    color: 'blue',
    canAct: true
  };
};