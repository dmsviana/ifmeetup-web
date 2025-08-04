import { z } from 'zod';

// schema para validação de dados de evento para participação
export const EventParticipationDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELED_BY_ORGANIZER', 'CANCELED_BY_ADMIN', 'CONCLUDED', 'IN_PROGRESS']),
  startDateTime: z.string(),
  endDateTime: z.string(),
  maxParticipants: z.number().min(1),
  currentParticipants: z.number().min(0).optional().default(0),
  publicEvent: z.boolean().default(true),
  organizer: z.object({
    id: z.string().uuid(),
    name: z.string()
  }).optional()
});

// schema para dados do usuário
export const UserParticipationDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()).optional().default([]),
  permissions: z.array(z.string()).optional().default([])
});

// enum para razões de inelegibilidade
export const IneligibilityReasonEnum = z.enum([
  'NOT_AUTHENTICATED',
  'EVENT_NOT_FOUND',
  'EVENT_NOT_APPROVED',
  'EVENT_CONCLUDED',
  'EVENT_CANCELED',
  'EVENT_IN_PROGRESS',
  'EVENT_FULL',
  'REGISTRATION_CLOSED',
  'ALREADY_REGISTERED',
  'NOT_PUBLIC_EVENT',
  'INSUFFICIENT_PERMISSIONS',
  'EVENT_PAST_START_TIME',
  'INVALID_EVENT_DATA',
  'INVALID_USER_DATA'
]);

// constantes para configuração de validação
export const PARTICIPATION_CONFIG = {
  // tempo antes do início do evento em que as inscrições são fechadas (em minutos)
  REGISTRATION_CUTOFF_MINUTES: 30,
  
  // tempo antes do início do evento em que cancelamentos são bloqueados (em minutos)
  CANCELLATION_CUTOFF_MINUTES: 60,
  
  // permissões necessárias para diferentes ações
  PERMISSIONS: {
    PARTICIPATE_IN_PRIVATE_EVENTS: 'PARTICIPATE_PRIVATE_EVENTS',
    BYPASS_CAPACITY_LIMIT: 'BYPASS_EVENT_CAPACITY',
    LATE_REGISTRATION: 'LATE_EVENT_REGISTRATION',
    LATE_CANCELLATION: 'LATE_EVENT_CANCELLATION'
  },
  
  // roles que têm privilégios especiais
  PRIVILEGED_ROLES: ['ADMIN', 'EVENT_MANAGER', 'ORGANIZER']
};

/**
 * Valida se um usuário pode se inscrever em um evento
 * @param {Object} eventData - dados do evento
 * @param {Object} userData - dados do usuário
 * @param {Object} participationStatus - status atual de participação
 * @param {Object} options - opções adicionais
 * @returns {Object} resultado da validação
 */
export const validateParticipationEligibility = (eventData, userData, participationStatus = {}, options = {}) => {
  const {
    skipTimeValidation = false,
    skipCapacityValidation = false,
    allowPrivateEvents = false
  } = options;

  try {
    // validar dados de entrada
    const validatedEvent = EventParticipationDataSchema.parse(eventData);
    const validatedUser = UserParticipationDataSchema.parse(userData);

    // verificar se usuário está autenticado
    if (!validatedUser.id) {
      return {
        canParticipate: false,
        reason: 'NOT_AUTHENTICATED',
        message: 'Usuário deve estar autenticado para participar',
        details: null
      };
    }

    // verificar se já está inscrito
    if (participationStatus.isRegistered) {
      return {
        canParticipate: false,
        reason: 'ALREADY_REGISTERED',
        message: 'Usuário já está inscrito neste evento',
        details: { registrationDate: participationStatus.registrationDate }
      };
    }

    // verificar status do evento
    const statusValidation = validateEventStatus(validatedEvent);
    if (!statusValidation.isValid) {
      return {
        canParticipate: false,
        reason: statusValidation.reason,
        message: statusValidation.message,
        details: statusValidation.details
      };
    }

    // verificar se evento é público ou se usuário tem permissão para eventos privados
    if (!validatedEvent.publicEvent && !allowPrivateEvents) {
      const hasPrivatePermission = hasPermission(validatedUser, PARTICIPATION_CONFIG.PERMISSIONS.PARTICIPATE_IN_PRIVATE_EVENTS);
      if (!hasPrivatePermission) {
        return {
          canParticipate: false,
          reason: 'NOT_PUBLIC_EVENT',
          message: 'Este evento não é público',
          details: null
        };
      }
    }

    // verificar capacidade do evento
    if (!skipCapacityValidation) {
      const capacityValidation = validateEventCapacity(validatedEvent, validatedUser);
      if (!capacityValidation.isValid) {
        return {
          canParticipate: false,
          reason: capacityValidation.reason,
          message: capacityValidation.message,
          details: capacityValidation.details
        };
      }
    }

    // verificar timing do evento
    if (!skipTimeValidation) {
      const timingValidation = validateEventTiming(validatedEvent, validatedUser, 'registration');
      if (!timingValidation.isValid) {
        return {
          canParticipate: false,
          reason: timingValidation.reason,
          message: timingValidation.message,
          details: timingValidation.details
        };
      }
    }

    // se chegou até aqui, usuário pode participar
    return {
      canParticipate: true,
      reason: null,
      message: 'Usuário pode se inscrever no evento',
      details: {
        eventTitle: validatedEvent.title,
        availableSpots: validatedEvent.maxParticipants - validatedEvent.currentParticipants,
        registrationDeadline: calculateRegistrationDeadline(validatedEvent.startDateTime)
      }
    };

  } catch (error) {
    console.error('Erro na validação de elegibilidade:', error);
    
    if (error instanceof z.ZodError) {
      return {
        canParticipate: false,
        reason: 'INVALID_EVENT_DATA',
        message: 'Dados do evento ou usuário são inválidos',
        details: { validationErrors: error.errors }
      };
    }

    return {
      canParticipate: false,
      reason: 'INVALID_EVENT_DATA',
      message: 'Erro interno na validação',
      details: { error: error.message }
    };
  }
};

/**
 * Valida se um usuário pode cancelar sua inscrição em um evento
 * @param {Object} eventData - dados do evento
 * @param {Object} userData - dados do usuário
 * @param {Object} participationStatus - status atual de participação
 * @param {Object} options - opções adicionais
 * @returns {Object} resultado da validação
 */
export const validateCancellationEligibility = (eventData, userData, participationStatus = {}, options = {}) => {
  const {
    skipTimeValidation = false
  } = options;

  try {
    // validar dados de entrada
    const validatedEvent = EventParticipationDataSchema.parse(eventData);
    const validatedUser = UserParticipationDataSchema.parse(userData);

    // verificar se usuário está autenticado
    if (!validatedUser.id) {
      return {
        canCancel: false,
        reason: 'NOT_AUTHENTICATED',
        message: 'Usuário deve estar autenticado para cancelar',
        details: null
      };
    }

    // verificar se está inscrito
    if (!participationStatus.isRegistered) {
      return {
        canCancel: false,
        reason: 'NOT_REGISTERED',
        message: 'Usuário não está inscrito neste evento',
        details: null
      };
    }

    // verificar status do evento
    if (validatedEvent.status === 'CONCLUDED') {
      return {
        canCancel: false,
        reason: 'EVENT_CONCLUDED',
        message: 'Não é possível cancelar inscrição em evento já concluído',
        details: null
      };
    }

    if (validatedEvent.status === 'CANCELED_BY_ORGANIZER' || validatedEvent.status === 'CANCELED_BY_ADMIN') {
      return {
        canCancel: false,
        reason: 'EVENT_CANCELED',
        message: 'Evento foi cancelado',
        details: null
      };
    }

    // verificar timing para cancelamento
    if (!skipTimeValidation) {
      const timingValidation = validateEventTiming(validatedEvent, validatedUser, 'cancellation');
      if (!timingValidation.isValid) {
        return {
          canCancel: false,
          reason: timingValidation.reason,
          message: timingValidation.message,
          details: timingValidation.details
        };
      }
    }

    // se chegou até aqui, usuário pode cancelar
    return {
      canCancel: true,
      reason: null,
      message: 'Usuário pode cancelar a inscrição',
      details: {
        eventTitle: validatedEvent.title,
        cancellationDeadline: calculateCancellationDeadline(validatedEvent.startDateTime)
      }
    };

  } catch (error) {
    console.error('Erro na validação de cancelamento:', error);
    
    return {
      canCancel: false,
      reason: 'INVALID_EVENT_DATA',
      message: 'Erro interno na validação',
      details: { error: error.message }
    };
  }
};

/**
 * Valida o status do evento para participação
 * @param {Object} eventData - dados do evento
 * @returns {Object} resultado da validação
 */
export const validateEventStatus = (eventData) => {
  switch (eventData.status) {
    case 'PENDING_APPROVAL':
      return {
        isValid: false,
        reason: 'EVENT_NOT_APPROVED',
        message: 'Evento ainda não foi aprovado',
        details: { currentStatus: eventData.status }
      };

    case 'REJECTED':
      return {
        isValid: false,
        reason: 'EVENT_NOT_APPROVED',
        message: 'Evento foi rejeitado',
        details: { currentStatus: eventData.status }
      };

    case 'CANCELED_BY_ORGANIZER':
    case 'CANCELED_BY_ADMIN':
      return {
        isValid: false,
        reason: 'EVENT_CANCELED',
        message: 'Evento foi cancelado',
        details: { currentStatus: eventData.status }
      };

    case 'CONCLUDED':
      return {
        isValid: false,
        reason: 'EVENT_CONCLUDED',
        message: 'Evento já foi concluído',
        details: { currentStatus: eventData.status }
      };

    case 'IN_PROGRESS':
      return {
        isValid: false,
        reason: 'EVENT_IN_PROGRESS',
        message: 'Evento já está em andamento',
        details: { currentStatus: eventData.status }
      };

    case 'APPROVED':
      return {
        isValid: true,
        reason: null,
        message: 'Evento está aprovado para participação',
        details: { currentStatus: eventData.status }
      };

    default:
      return {
        isValid: false,
        reason: 'INVALID_EVENT_DATA',
        message: 'Status do evento é inválido',
        details: { currentStatus: eventData.status }
      };
  }
};

/**
 * Valida a capacidade do evento
 * @param {Object} eventData - dados do evento
 * @param {Object} userData - dados do usuário
 * @returns {Object} resultado da validação
 */
export const validateEventCapacity = (eventData, userData) => {
  const currentParticipants = eventData.currentParticipants || 0;
  const maxParticipants = eventData.maxParticipants;
  const availableSpots = maxParticipants - currentParticipants;

  // verificar se usuário tem permissão para ignorar limite de capacidade
  const canBypassCapacity = hasPermission(userData, PARTICIPATION_CONFIG.PERMISSIONS.BYPASS_CAPACITY_LIMIT);

  if (availableSpots <= 0 && !canBypassCapacity) {
    return {
      isValid: false,
      reason: 'EVENT_FULL',
      message: 'Evento está lotado',
      details: {
        currentParticipants,
        maxParticipants,
        availableSpots: 0
      }
    };
  }

  return {
    isValid: true,
    reason: null,
    message: 'Há vagas disponíveis',
    details: {
      currentParticipants,
      maxParticipants,
      availableSpots: Math.max(0, availableSpots)
    }
  };
};

/**
 * Valida o timing do evento para inscrição ou cancelamento
 * @param {Object} eventData - dados do evento
 * @param {Object} userData - dados do usuário
 * @param {string} action - 'registration' ou 'cancellation'
 * @returns {Object} resultado da validação
 */
export const validateEventTiming = (eventData, userData, action = 'registration') => {
  const now = new Date();
  const eventStart = new Date(eventData.startDateTime);
  const eventEnd = new Date(eventData.endDateTime);

  // verificar se evento já passou
  if (eventEnd < now) {
    return {
      isValid: false,
      reason: 'EVENT_CONCLUDED',
      message: 'Evento já terminou',
      details: {
        eventStart: eventData.startDateTime,
        eventEnd: eventData.endDateTime,
        currentTime: now.toISOString()
      }
    };
  }

  // verificar se evento já começou
  if (eventStart <= now) {
    const canDoLateAction = action === 'registration' 
      ? hasPermission(userData, PARTICIPATION_CONFIG.PERMISSIONS.LATE_REGISTRATION)
      : hasPermission(userData, PARTICIPATION_CONFIG.PERMISSIONS.LATE_CANCELLATION);

    if (!canDoLateAction) {
      return {
        isValid: false,
        reason: action === 'registration' ? 'EVENT_PAST_START_TIME' : 'EVENT_IN_PROGRESS',
        message: action === 'registration' 
          ? 'Não é possível se inscrever após o início do evento'
          : 'Não é possível cancelar após o início do evento',
        details: {
          eventStart: eventData.startDateTime,
          currentTime: now.toISOString()
        }
      };
    }
  }

  // verificar cutoff times
  const cutoffMinutes = action === 'registration' 
    ? PARTICIPATION_CONFIG.REGISTRATION_CUTOFF_MINUTES
    : PARTICIPATION_CONFIG.CANCELLATION_CUTOFF_MINUTES;

  const cutoffTime = new Date(eventStart.getTime() - (cutoffMinutes * 60 * 1000));

  if (now > cutoffTime) {
    const canDoLateAction = action === 'registration' 
      ? hasPermission(userData, PARTICIPATION_CONFIG.PERMISSIONS.LATE_REGISTRATION)
      : hasPermission(userData, PARTICIPATION_CONFIG.PERMISSIONS.LATE_CANCELLATION);

    if (!canDoLateAction) {
      return {
        isValid: false,
        reason: 'REGISTRATION_CLOSED',
        message: action === 'registration'
          ? `Inscrições encerradas ${cutoffMinutes} minutos antes do evento`
          : `Cancelamentos não permitidos ${cutoffMinutes} minutos antes do evento`,
        details: {
          cutoffTime: cutoffTime.toISOString(),
          eventStart: eventData.startDateTime,
          currentTime: now.toISOString()
        }
      };
    }
  }

  return {
    isValid: true,
    reason: null,
    message: `Timing válido para ${action}`,
    details: {
      eventStart: eventData.startDateTime,
      cutoffTime: cutoffTime.toISOString(),
      currentTime: now.toISOString()
    }
  };
};

/**
 * Verifica se usuário tem uma permissão específica
 * @param {Object} userData - dados do usuário
 * @param {string} permission - permissão a verificar
 * @returns {boolean} se tem a permissão
 */
export const hasPermission = (userData, permission) => {
  if (!userData || !permission) return false;

  // verificar se tem a permissão diretamente
  if (userData.permissions && userData.permissions.includes(permission)) {
    return true;
  }

  // verificar se tem role privilegiado
  if (userData.roles) {
    return userData.roles.some(role => PARTICIPATION_CONFIG.PRIVILEGED_ROLES.includes(role));
  }

  return false;
};

/**
 * Verifica se usuário tem role específico
 * @param {Object} userData - dados do usuário
 * @param {string} role - role a verificar
 * @returns {boolean} se tem o role
 */
export const hasRole = (userData, role) => {
  if (!userData || !role) return false;
  return userData.roles && userData.roles.includes(role);
};

/**
 * Calcula deadline para inscrições
 * @param {string} eventStartDateTime - data/hora de início do evento
 * @returns {string} deadline em ISO string
 */
export const calculateRegistrationDeadline = (eventStartDateTime) => {
  const eventStart = new Date(eventStartDateTime);
  const deadline = new Date(eventStart.getTime() - (PARTICIPATION_CONFIG.REGISTRATION_CUTOFF_MINUTES * 60 * 1000));
  return deadline.toISOString();
};

/**
 * Calcula deadline para cancelamentos
 * @param {string} eventStartDateTime - data/hora de início do evento
 * @returns {string} deadline em ISO string
 */
export const calculateCancellationDeadline = (eventStartDateTime) => {
  const eventStart = new Date(eventStartDateTime);
  const deadline = new Date(eventStart.getTime() - (PARTICIPATION_CONFIG.CANCELLATION_CUTOFF_MINUTES * 60 * 1000));
  return deadline.toISOString();
};

/**
 * Determina o status de participação baseado nas validações
 * @param {Object} eventData - dados do evento
 * @param {Object} userData - dados do usuário
 * @param {Object} participationStatus - status atual de participação
 * @returns {Object} status determinado
 */
export const determineParticipationStatus = (eventData, userData, participationStatus = {}) => {
  if (!eventData || !userData) {
    return {
      status: 'unknown',
      canRegister: false,
      canCancel: false,
      reason: 'INVALID_EVENT_DATA',
      message: 'Dados insuficientes para determinar status'
    };
  }

  // se já está inscrito
  if (participationStatus.isRegistered) {
    const cancellationValidation = validateCancellationEligibility(eventData, userData, participationStatus);
    
    return {
      status: 'registered',
      canRegister: false,
      canCancel: cancellationValidation.canCancel,
      reason: cancellationValidation.reason,
      message: 'Usuário está inscrito no evento',
      details: {
        registrationDate: participationStatus.registrationDate,
        canCancel: cancellationValidation.canCancel,
        cancellationReason: cancellationValidation.reason
      }
    };
  }

  // verificar se pode se inscrever
  const registrationValidation = validateParticipationEligibility(eventData, userData, participationStatus);

  if (registrationValidation.canParticipate) {
    return {
      status: 'available',
      canRegister: true,
      canCancel: false,
      reason: null,
      message: 'Inscrições disponíveis',
      details: registrationValidation.details
    };
  }

  // determinar status baseado na razão de inelegibilidade
  let status = 'unavailable';
  
  if (registrationValidation.reason === 'EVENT_FULL') {
    status = 'full';
  } else if (registrationValidation.reason === 'REGISTRATION_CLOSED' || 
             registrationValidation.reason === 'EVENT_PAST_START_TIME') {
    status = 'closed';
  } else if (registrationValidation.reason === 'EVENT_CANCELED' || 
             registrationValidation.reason === 'EVENT_CONCLUDED') {
    status = 'ended';
  }

  return {
    status,
    canRegister: false,
    canCancel: false,
    reason: registrationValidation.reason,
    message: registrationValidation.message,
    details: registrationValidation.details
  };
};

/**
 * Valida dados de evento para operações de participação
 * @param {Object} eventData - dados do evento
 * @returns {Object} resultado da validação
 */
export const validateEventData = (eventData) => {
  try {
    const validatedEvent = EventParticipationDataSchema.parse(eventData);
    return {
      isValid: true,
      data: validatedEvent,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.reduce((acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {})
      };
    }

    return {
      isValid: false,
      data: null,
      errors: { general: error.message }
    };
  }
};

/**
 * Valida dados de usuário para operações de participação
 * @param {Object} userData - dados do usuário
 * @returns {Object} resultado da validação
 */
export const validateUserData = (userData) => {
  try {
    const validatedUser = UserParticipationDataSchema.parse(userData);
    return {
      isValid: true,
      data: validatedUser,
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.reduce((acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {})
      };
    }

    return {
      isValid: false,
      data: null,
      errors: { general: error.message }
    };
  }
};

/**
 * Obtém mensagem amigável para razão de inelegibilidade
 * @param {string} reason - razão da inelegibilidade
 * @returns {string} mensagem amigável
 */
export const getFriendlyIneligibilityMessage = (reason) => {
  const messages = {
    'NOT_AUTHENTICATED': 'Você precisa estar logado para participar',
    'EVENT_NOT_FOUND': 'Evento não encontrado',
    'EVENT_NOT_APPROVED': 'Evento ainda não foi aprovado',
    'EVENT_CONCLUDED': 'Evento já foi concluído',
    'EVENT_CANCELED': 'Evento foi cancelado',
    'EVENT_IN_PROGRESS': 'Evento já está em andamento',
    'EVENT_FULL': 'Evento está lotado',
    'REGISTRATION_CLOSED': 'Inscrições foram encerradas',
    'ALREADY_REGISTERED': 'Você já está inscrito neste evento',
    'NOT_PUBLIC_EVENT': 'Este evento não é público',
    'INSUFFICIENT_PERMISSIONS': 'Você não tem permissão para participar',
    'EVENT_PAST_START_TIME': 'Não é possível se inscrever após o início',
    'INVALID_EVENT_DATA': 'Dados do evento são inválidos',
    'INVALID_USER_DATA': 'Dados do usuário são inválidos'
  };

  return messages[reason] || 'Não é possível participar deste evento';
};

// PARTICIPATION_CONFIG já foi exportado acima