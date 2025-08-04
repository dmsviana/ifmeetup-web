import api, { handleApiError } from './httpClient';
import { z } from 'zod';
import { processParticipationError } from '../utils/participationErrorHandler';

// schemas para validação das respostas da API de participação
export const AttendanceStatusEnum = z.enum([
  'REGISTERED',
  'PRESENT', 
  'ABSENT',
  'CANCELED'
]);

export const EventParticipantResponseSchema = z.object({
  id: z.string().uuid(),
  event: z.object({
    id: z.string().uuid(),
    title: z.string()
  }),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email()
  }),
  registrationDateTime: z.string(),
  attendanceStatus: AttendanceStatusEnum,
  certificateIssued: z.boolean(),
  feedback: z.string().optional()
});

export const FeedbackRequestSchema = z.object({
  feedback: z.string()
    .min(10, 'Feedback deve ter pelo menos 10 caracteres')
    .max(1000, 'Feedback deve ter no máximo 1000 caracteres')
});

class EventParticipationService {
  // endpoint base para participação
  static BASE_URL = '/events';

  // helper para implementar retry logic
  static async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // não fazer retry para erros que não são de rede
        if (error.response) {
          const status = error.response.status;
          // não fazer retry para erros 4xx (exceto 408 timeout)
          if (status >= 400 && status < 500 && status !== 408) {
            throw error;
          }
        }
        
        // se é a última tentativa, lançar o erro
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // calcular delay com backoff exponencial
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // inscrever usuário em evento
  static async registerForEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      const operation = async () => {
        const response = await api.post(`${this.BASE_URL}/${eventId}/register`);
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta com schema
      const validatedData = EventParticipantResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'registration', {
        eventId,
        operation: 'registerForEvent'
      });

      return {
        success: false,
        data: null,
        error: structuredError
      };
    }
  }

  // cancelar inscrição em evento
  static async cancelRegistration(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      const operation = async () => {
        const response = await api.delete(`${this.BASE_URL}/${eventId}/registration`);
        return response;
      };

      await this.withRetry(operation);

      return {
        success: true,
        data: { message: 'Inscrição cancelada com sucesso' },
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'cancellation', {
        eventId,
        operation: 'cancelRegistration'
      });

      return {
        success: false,
        data: null,
        error: structuredError
      };
    }
  }

  // verificar status de inscrição do usuário
  static async checkRegistrationStatus(eventId, userId) {
    try {
      if (!eventId || !userId) {
        throw new Error('ID do evento e do usuário são obrigatórios');
      }

      const operation = async () => {
        const response = await api.get(
          `${this.BASE_URL}/${eventId}/registration/check`,
          { params: { userId } }
        );
        return response;
      };

      const response = await this.withRetry(operation);

      // a API retorna um boolean diretamente
      const isRegistered = Boolean(response.data);

      return {
        success: true,
        data: { isRegistered },
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        eventId,
        userId,
        operation: 'checkRegistrationStatus'
      });

      return {
        success: false,
        data: { isRegistered: false },
        error: structuredError
      };
    }
  }

  // obter contagem de participantes confirmados
  static async getParticipantsCount(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      const operation = async () => {
        const response = await api.get(`${this.BASE_URL}/${eventId}/participants/count`);
        return response;
      };

      const response = await this.withRetry(operation);

      // a API retorna um número diretamente
      const count = Number(response.data) || 0;

      return {
        success: true,
        data: { count },
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        eventId,
        operation: 'getParticipantsCount'
      });

      return {
        success: false,
        data: { count: 0 },
        error: structuredError
      };
    }
  }

  // obter lista de participantes do evento (para organizadores)
  static async getEventParticipants(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      const operation = async () => {
        const response = await api.get(`${this.BASE_URL}/${eventId}/participants`);
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta - pode ser array ou objeto único
      let participants = [];
      if (Array.isArray(response.data)) {
        participants = response.data.map(participant => 
          EventParticipantResponseSchema.parse(participant)
        );
      } else if (response.data) {
        // se retornar objeto único, transformar em array
        participants = [EventParticipantResponseSchema.parse(response.data)];
      }

      return {
        success: true,
        data: participants,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'participantsList', {
        eventId,
        operation: 'getEventParticipants'
      });

      return {
        success: false,
        data: [],
        error: structuredError
      };
    }
  }

  // atualizar status de presença (para organizadores)
  static async updateAttendanceStatus(eventId, userId, status) {
    try {
      if (!eventId || !userId || !status) {
        throw new Error('ID do evento, usuário e status são obrigatórios');
      }

      // validar status
      AttendanceStatusEnum.parse(status);

      const operation = async () => {
        const response = await api.put(
          `${this.BASE_URL}/${eventId}/attendance`,
          null,
          { params: { userId, status } }
        );
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta
      const validatedData = EventParticipantResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'participantsList', {
        eventId,
        userId,
        status,
        operation: 'updateAttendanceStatus'
      });

      return {
        success: false,
        data: null,
        error: structuredError
      };
    }
  }

  // fornecer feedback sobre evento
  static async provideFeedback(eventId, feedback) {
    try {
      if (!eventId || !feedback) {
        throw new Error('ID do evento e feedback são obrigatórios');
      }

      // validar feedback
      const validatedFeedback = FeedbackRequestSchema.parse({ feedback });

      const operation = async () => {
        const response = await api.post(
          `${this.BASE_URL}/${eventId}/feedback`,
          validatedFeedback
        );
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta
      const validatedData = EventParticipantResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'feedback', {
        eventId,
        feedback: feedback.substring(0, 50) + '...', // apenas primeiros 50 chars para log
        operation: 'provideFeedback'
      });

      return {
        success: false,
        data: null,
        error: structuredError
      };
    }
  }

  // obter eventos de um usuário específico
  static async getUserEvents(userId) {
    try {
      if (!userId) {
        throw new Error('ID do usuário é obrigatório');
      }

      const operation = async () => {
        const response = await api.get(
          '/events/participants/events',
          { params: { userId } }
        );
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta - pode ser array ou objeto único
      let events = [];
      if (Array.isArray(response.data)) {
        events = response.data.map(event => 
          EventParticipantResponseSchema.parse(event)
        );
      } else if (response.data) {
        events = [EventParticipantResponseSchema.parse(response.data)];
      }

      return {
        success: true,
        data: events,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        userId,
        operation: 'getUserEvents'
      });

      return {
        success: false,
        data: [],
        error: structuredError
      };
    }
  }

  // obter meus eventos (usuário atual)
  static async getMyEvents() {
    try {
      const operation = async () => {
        const response = await api.get('/events/participants/my-events');
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta - pode ser array ou objeto único
      let events = [];
      if (Array.isArray(response.data)) {
        events = response.data.map(event => 
          EventParticipantResponseSchema.parse(event)
        );
      } else if (response.data) {
        events = [EventParticipantResponseSchema.parse(response.data)];
      }

      return {
        success: true,
        data: events,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        operation: 'getMyEvents'
      });

      return {
        success: false,
        data: [],
        error: structuredError
      };
    }
  }

  // helper para verificar se usuário pode se inscrever em evento
  static async canUserRegister(eventId, userId) {
    try {
      // verificar se já está inscrito
      const statusResult = await this.checkRegistrationStatus(eventId, userId);
      if (!statusResult.success || statusResult.data.isRegistered) {
        return {
          canRegister: false,
          reason: 'already_registered'
        };
      }

      // verificar contagem de participantes (precisaria do maxParticipants do evento)
      // isso seria implementado quando tivermos acesso aos dados do evento
      
      return {
        canRegister: true,
        reason: null
      };
    } catch {
      return {
        canRegister: false,
        reason: 'error_checking'
      };
    }
  }

  // helper para obter status completo de participação
  static async getParticipationStatus(eventId, userId) {
    try {
      const [statusResult, countResult] = await Promise.all([
        this.checkRegistrationStatus(eventId, userId),
        this.getParticipantsCount(eventId)
      ]);

      return {
        success: true,
        data: {
          eventId,
          isRegistered: statusResult.success ? statusResult.data.isRegistered : false,
          participantsCount: countResult.success ? countResult.data.count : 0,
          canRegister: statusResult.success ? !statusResult.data.isRegistered : true,
          lastUpdated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        eventId,
        userId,
        operation: 'getParticipationStatus'
      });

      return {
        success: false,
        data: {
          eventId,
          isRegistered: false,
          participantsCount: 0,
          canRegister: false,
          lastUpdated: new Date().toISOString()
        },
        error: structuredError
      };
    }
  }

  // helper para operações em lote (verificar status de múltiplos eventos)
  static async getBulkParticipationStatus(eventIds, userId) {
    try {
      if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return {
          success: true,
          data: new Map(),
          error: null
        };
      }

      // fazer requisições em paralelo com limite de concorrência
      const batchSize = 5; // limitar a 5 requisições simultâneas
      const results = new Map();
      
      for (let i = 0; i < eventIds.length; i += batchSize) {
        const batch = eventIds.slice(i, i + batchSize);
        const batchPromises = batch.map(eventId => 
          this.getParticipationStatus(eventId, userId)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach((result, index) => {
          const eventId = batch[index];
          results.set(eventId, result.success ? result.data : {
            eventId,
            isRegistered: false,
            participantsCount: 0,
            canRegister: false,
            lastUpdated: new Date().toISOString()
          });
        });
      }

      return {
        success: true,
        data: results,
        error: null
      };
    } catch (error) {
      // usar novo sistema de tratamento de erros
      const structuredError = processParticipationError(error, 'statusCheck', {
        eventIds: eventIds.length,
        userId,
        operation: 'getBulkParticipationStatus'
      });

      return {
        success: false,
        data: new Map(),
        error: structuredError
      };
    }
  }
}

export default EventParticipationService;