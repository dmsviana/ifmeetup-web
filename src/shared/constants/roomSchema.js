import { z } from 'zod';

// enum para tipos de sala
export const RoomTypeEnum = z.enum([
  'CLASSROOM',
  'AUDITORIUM', 
  'LABORATORY',
  'MEETING_ROOM',
  'SHARED_SPACE',
  'OTHER'
]);

// enum para status da sala
export const RoomStatusEnum = z.enum([
  'AVAILABLE',
  'UNAVAILABLE',
  'UNDER_MAINTENANCE',
  'DISABLED'
]);

// enum para tipos de recursos
export const ResourceTypeEnum = z.enum([
  'PROJECTOR',
  'COMPUTER',
  'WHITEBOARD',
  'SOUND_SYSTEM',
  'AIR_CONDITIONING',
  'PRINTER',
  'VIDEO_CONFERENCE_SYSTEM',
  'OTHER'
]);

// schema para recurso da sala
export const ResourceSchema = z.object({
  id: z.string().uuid().optional(),
  resourceType: ResourceTypeEnum,
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0').max(999, 'Quantidade máxima é 999'),
  details: z.string().max(255, 'Detalhes devem ter no máximo 255 caracteres').optional()
});

// schema para request de criação/atualização de recurso
export const ResourceRequestSchema = ResourceSchema.omit({ id: true });

// schema para response de recurso
export const ResourceResponseSchema = ResourceSchema.required({ id: true });

// schema principal da sala
export const RoomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  location: z.string()
    .max(255, 'Localização deve ter no máximo 255 caracteres')
    .optional(),
  capacity: z.number()
    .min(1, 'Capacidade deve ser pelo menos 1 pessoa')
    .max(1000, 'Capacidade máxima é 1000 pessoas'),
  type: RoomTypeEnum,
  status: RoomStatusEnum,
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  resources: z.array(ResourceSchema).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// schema para request de criação/atualização de sala
export const RoomRequestSchema = RoomSchema.omit({ 
  id: true, 
  createdBy: true, 
  updatedBy: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  resources: z.array(ResourceRequestSchema).optional()
});

// schema para response de sala
export const RoomResponseSchema = RoomSchema.required({ id: true }).extend({
  resources: z.array(ResourceResponseSchema).optional()
});

// schema para request de mudança de status
export const RoomStatusRequestSchema = z.object({
  status: RoomStatusEnum,
  reason: z.string()
    .max(500, 'Motivo deve ter no máximo 500 caracteres')
    .optional()
});

// schema para resposta de lista paginada
export const PageRoomResponseSchema = z.object({
  content: z.array(RoomResponseSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
  first: z.boolean(),
  last: z.boolean(),
  numberOfElements: z.number(),
  empty: z.boolean()
});

// helpers de validação para formulários
export const validateRoom = (data) => {
  try {
    return {
      success: true,
      data: RoomRequestSchema.parse(data),
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

export const validateResource = (data) => {
  try {
    return {
      success: true,
      data: ResourceRequestSchema.parse(data),
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

export const validateRoomStatus = (data) => {
  try {
    return {
      success: true,
      data: RoomStatusRequestSchema.parse(data),
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

// constants para uso em componentes
export const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Sala de Aula' },
  { value: 'AUDITORIUM', label: 'Auditório' },
  { value: 'LABORATORY', label: 'Laboratório' },
  { value: 'MEETING_ROOM', label: 'Sala de Reunião' },
  { value: 'SHARED_SPACE', label: 'Espaço Compartilhado' },
  { value: 'OTHER', label: 'Outro' }
];

export const ROOM_STATUSES = [
  { value: 'AVAILABLE', label: 'Disponível', color: 'green' },
  { value: 'UNAVAILABLE', label: 'Indisponível', color: 'red' },
  { value: 'UNDER_MAINTENANCE', label: 'Em Manutenção', color: 'yellow' },
  { value: 'DISABLED', label: 'Desabilitada', color: 'gray' }
];

export const RESOURCE_TYPES = [
  { value: 'PROJECTOR', label: 'Projetor' },
  { value: 'COMPUTER', label: 'Computador' },
  { value: 'WHITEBOARD', label: 'Quadro Branco' },
  { value: 'SOUND_SYSTEM', label: 'Sistema de Som' },
  { value: 'AIR_CONDITIONING', label: 'Ar Condicionado' },
  { value: 'PRINTER', label: 'Impressora' },
  { value: 'VIDEO_CONFERENCE_SYSTEM', label: 'Sistema de Videoconferência' },
  { value: 'OTHER', label: 'Outro' }
]; 