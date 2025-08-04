import api, { handleApiError } from './httpClient';
import {
  EventResponseSchema,
  PageEventResponseSchema,
  EventCreateRequestSchema,
  EventUpdateRequestSchema,
  EventRejectRequestSchema,
  DashboardStatsSchema
} from '../schemas/eventSchema';

class EventService {
  // endpoint base
  static BASE_URL = '/events';

  // helper para construir query params
  static buildQueryParams(params) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return queryParams.toString();
  }

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

  // listar todos os eventos com paginação e ordenação
  static async getAllEvents(params = {}) {
    try {
      const {
        page = 0,
        size = 20,
        sort = 'startDateTime',
        direction = 'ASC'
      } = params;

      const queryString = this.buildQueryParams({
        page,
        size,
        sort,
        direction
      });

      const response = await api.get(
        `${this.BASE_URL}?${queryString}`
      );

      // validar resposta com schema
      const validatedData = PageEventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // buscar eventos futuros aprovados (para homepage)
  static async getFutureEvents(params = {}) {
    try {
      const {
        page = 0,
        size = 12,
        sort = 'startDateTime',
        direction = 'ASC'
      } = params;

      // buscar todos os eventos e filtrar localmente
      // isso é necessário pois a API não tem endpoint específico para eventos futuros
      const result = await this.getAllEvents({ page, size: 100, sort, direction });

      if (!result.success) {
        return result;
      }

      // filtrar apenas eventos aprovados e futuros
      const now = new Date();
      const futureEvents = result.data.content.filter(event => {
        const eventStart = new Date(event.startDateTime);
        return event.status === 'APPROVED' && eventStart > now;
      });

      // aplicar paginação local
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedEvents = futureEvents.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          content: paginatedEvents,
          totalElements: futureEvents.length,
          totalPages: Math.ceil(futureEvents.length / size),
          size: size,
          number: page,
          first: page === 0,
          last: endIndex >= futureEvents.length,
          numberOfElements: paginatedEvents.length,
          empty: paginatedEvents.length === 0
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // buscar evento por id
  static async getEventById(id) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/${id}`);

      // validar resposta com schema
      const validatedData = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // criar novo evento
  static async createEvent(eventData) {
    try {
      // validar dados antes de enviar
      const validatedData = EventCreateRequestSchema.parse(eventData);

      const response = await api.post(this.BASE_URL, validatedData);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // atualizar evento existente
  static async updateEvent(id, eventData) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      // validar dados antes de enviar
      const validatedData = EventUpdateRequestSchema.parse(eventData);

      const response = await api.put(`${this.BASE_URL}/${id}`, validatedData);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // aprovar evento
  static async approveEvent(id) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      const response = await api.post(`${this.BASE_URL}/${id}/approve`);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // rejeitar evento
  static async rejectEvent(id, rejectionData) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      // validar dados antes de enviar
      const validatedData = EventRejectRequestSchema.parse(rejectionData);

      const response = await api.post(`${this.BASE_URL}/${id}/reject`, validatedData);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // cancelar evento (organizador)
  static async cancelEventByOrganizer(id) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      const response = await api.post(`${this.BASE_URL}/${id}/cancel`);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // cancelar evento (administrador)
  static async cancelEventByAdmin(id) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      const response = await api.post(`${this.BASE_URL}/${id}/cancel-admin`);

      // validar resposta
      const validatedResponse = EventResponseSchema.parse(response.data);

      return {
        success: true,
        data: validatedResponse,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // excluir evento (administrador)
  static async deleteEvent(id) {
    try {
      if (!id) {
        throw new Error('ID do evento é obrigatório');
      }

      await api.delete(`${this.BASE_URL}/${id}`);

      return {
        success: true,
        data: { message: 'Evento excluído com sucesso' },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // filtrar eventos por tipo
  static async getEventsByType(eventType) {
    try {
      if (!eventType) {
        throw new Error('Tipo do evento é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/type/${eventType}`);

      // validar resposta - array de eventos
      const validatedData = response.data.map(event => EventResponseSchema.parse(event));

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // filtrar eventos por status
  static async getEventsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Status do evento é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/status/${status}`);

      // validar resposta - array de eventos
      const validatedData = response.data.content.map(event => EventResponseSchema.parse(event));

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // filtrar eventos por sala
  static async getEventsByRoom(roomId) {
    try {
      if (!roomId) {
        throw new Error('ID da sala é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/room/${roomId}`);

      // validar resposta - array de eventos
      const validatedData = response.data.map(event => EventResponseSchema.parse(event));

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // filtrar eventos por organizador
  static async getEventsByOrganizer(organizerId) {
    try {
      if (!organizerId) {
        throw new Error('ID do organizador é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/organizer/${organizerId}`);

      // validar resposta - array de eventos
      const validatedData = response.data.map(event => EventResponseSchema.parse(event));

      return {
        success: true,
        data: validatedData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // obter estatísticas do dashboard
  static async getDashboardStats() {
    try {
      // como não há endpoint específico para estatísticas, vamos calcular localmente
      // buscar dados necessários
      const eventsResult = await this.getAllEvents({ size: 1000 });
      const roomsResponse = await api.get('/rooms', { params: { size: 1000 } });

      let stats = {
        activeEvents: 0,
        totalParticipants: 0,
        availableRooms: 0,
        ongoingEvents: 0
      };

      // processar eventos se a requisição foi bem-sucedida
      if (eventsResult.success) {
        const events = eventsResult.data.content;
        const now = new Date();

        stats.activeEvents = events.filter(event => event.status === 'APPROVED').length;
        stats.totalParticipants = events.reduce((total, event) => total + (event.currentParticipants || 0), 0);
        stats.ongoingEvents = events.filter(event => {
          if (event.status !== 'IN_PROGRESS') return false;
          const start = new Date(event.startDateTime);
          const end = new Date(event.endDateTime);
          return now >= start && now <= end;
        }).length;
      }

      // processar salas
      if (roomsResponse.data && roomsResponse.data.content) {
        const rooms = roomsResponse.data.content;
        stats.availableRooms = rooms.filter(room => room.status === 'AVAILABLE').length;
      }

      // validar dados com schema
      const validatedStats = DashboardStatsSchema.parse(stats);

      return {
        success: true,
        data: validatedStats,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // método helper para busca avançada com múltiplos filtros
  static async searchEvents(filters = {}) {
    try {
      const {
        search,
        eventType,
        status,
        organizerId,
        roomId,
        startDate,
        endDate,
        futureOnly = false,
        page = 0,
        size = 20,
        sort = 'startDateTime',
        direction = 'ASC'
      } = filters;

      // se houver filtro específico, usar endpoints apropriados
      if (eventType && !status && !organizerId && !roomId) {
        return await this.getEventsByType(eventType);
      }

      if (status && !eventType && !organizerId && !roomId) {
        return await this.getEventsByStatus(status);
      }

      if (organizerId && !eventType && !status && !roomId) {
        return await this.getEventsByOrganizer(organizerId);
      }

      if (roomId && !eventType && !status && !organizerId) {
        return await this.getEventsByRoom(roomId);
      }

      // se for busca por eventos futuros, usar método específico
      if (futureOnly && !eventType && !status && !organizerId && !roomId) {
        return await this.getFutureEvents({ page, size, sort, direction });
      }

      // caso contrário, usar endpoint geral com filtros locais
      const result = await this.getAllEvents({ page, size: 1000, sort, direction });

      if (!result.success) {
        return result;
      }

      // aplicar filtros locais
      let filteredEvents = result.data.content;

      if (search) {
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.description?.toLowerCase().includes(search.toLowerCase()) ||
          event.organizer?.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (eventType) {
        filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
      }

      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }

      if (organizerId) {
        filteredEvents = filteredEvents.filter(event => event.organizer?.id === organizerId);
      }

      if (roomId) {
        filteredEvents = filteredEvents.filter(event => event.room?.id === roomId);
      }

      if (startDate) {
        const filterStartDate = new Date(startDate);
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.startDateTime) >= filterStartDate
        );
      }

      if (endDate) {
        const filterEndDate = new Date(endDate);
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.endDateTime) <= filterEndDate
        );
      }

      if (futureOnly) {
        const now = new Date();
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.startDateTime) > now && event.status === 'APPROVED'
        );
      }

      // aplicar paginação local
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          content: paginatedEvents,
          totalElements: filteredEvents.length,
          totalPages: Math.ceil(filteredEvents.length / size),
          size: size,
          number: page,
          first: page === 0,
          last: endIndex >= filteredEvents.length,
          numberOfElements: paginatedEvents.length,
          empty: paginatedEvents.length === 0
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: handleApiError(error)
      };
    }
  }

  // método para inscrição em evento - integrado com EventParticipationService
  static async subscribeToEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      // usar retry logic para operações críticas
      const operation = async () => {
        const response = await api.post(`${this.BASE_URL}/${eventId}/register`);
        return response;
      };

      const response = await this.withRetry(operation);

      // validar resposta básica - EventParticipationService tem validação mais detalhada
      if (response.data) {
        return {
          success: true,
          data: response.data,
          error: null
        };
      }

      return {
        success: true,
        data: { message: 'Inscrição realizada com sucesso' },
        error: null
      };
    } catch (error) {
      const apiError = handleApiError(error);
      
      // categorizar erros específicos de participação
      if (error.response?.status === 409) {
        apiError.type = 'already_registered';
        apiError.message = 'Você já está inscrito neste evento';
      } else if (error.response?.status === 422) {
        apiError.type = 'event_full';
        apiError.message = 'Este evento está lotado';
      }

      return {
        success: false,
        data: null,
        error: apiError
      };
    }
  }

  // método para cancelar inscrição em evento - integrado com EventParticipationService
  static async unsubscribeFromEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      // usar retry logic para operações críticas
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
      const apiError = handleApiError(error);
      
      // categorizar erros específicos de cancelamento
      if (error.response?.status === 404) {
        apiError.type = 'not_registered';
        apiError.message = 'Você não está inscrito neste evento';
      } else if (error.response?.status === 422) {
        apiError.type = 'event_started';
        apiError.message = 'Não é possível cancelar após o início do evento';
      }

      return {
        success: false,
        data: null,
        error: apiError
      };
    }
  }

  // método para verificar se usuário está inscrito em evento - integrado com EventParticipationService
  static async checkUserSubscription(eventId, userId) {
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
      const isSubscribed = Boolean(response.data);

      return {
        success: true,
        data: { isSubscribed },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: { isSubscribed: false },
        error: handleApiError(error)
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
      return {
        success: false,
        data: { count: 0 },
        error: handleApiError(error)
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

      // a API pode retornar array ou objeto único
      let participants = [];
      if (Array.isArray(response.data)) {
        participants = response.data;
      } else if (response.data) {
        // se retornar objeto único, transformar em array
        participants = [response.data];
      }

      return {
        success: true,
        data: participants,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: handleApiError(error)
      };
    }
  }

  // atualizar status de presença (para organizadores)
  static async updateAttendanceStatus(eventId, userId, status) {
    try {
      if (!eventId || !userId || !status) {
        throw new Error('ID do evento, usuário e status são obrigatórios');
      }

      const operation = async () => {
        const response = await api.put(
          `${this.BASE_URL}/${eventId}/attendance`,
          null,
          { params: { userId, status } }
        );
        return response;
      };

      const response = await this.withRetry(operation);

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      const apiError = handleApiError(error);
      
      // categorizar erros específicos de atualização de presença
      if (error.response?.status === 403) {
        apiError.type = 'no_permission';
        apiError.message = 'Você não tem permissão para atualizar a presença';
      } else if (error.response?.status === 422) {
        apiError.type = 'invalid_status';
        apiError.message = 'Status de presença inválido';
      }

      return {
        success: false,
        data: null,
        error: apiError
      };
    }
  }

  // fornecer feedback sobre evento
  static async provideFeedback(eventId, feedback) {
    try {
      if (!eventId || !feedback) {
        throw new Error('ID do evento e feedback são obrigatórios');
      }

      const operation = async () => {
        const response = await api.post(
          `${this.BASE_URL}/${eventId}/feedback`,
          { feedback }
        );
        return response;
      };

      const response = await this.withRetry(operation);

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      const apiError = handleApiError(error);
      
      // categorizar erros específicos de feedback
      if (error.response?.status === 422) {
        apiError.type = 'feedback_not_allowed';
        apiError.message = 'Feedback só pode ser fornecido após o evento terminar';
      }

      return {
        success: false,
        data: null,
        error: apiError
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

      // a API pode retornar array ou objeto único
      let events = [];
      if (Array.isArray(response.data)) {
        events = response.data;
      } else if (response.data) {
        events = [response.data];
      }

      return {
        success: true,
        data: events,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: handleApiError(error)
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

      // a API pode retornar array ou objeto único
      let events = [];
      if (Array.isArray(response.data)) {
        events = response.data;
      } else if (response.data) {
        events = [response.data];
      }

      return {
        success: true,
        data: events,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: handleApiError(error)
      };
    }
  }

  // helper para obter status completo de participação
  static async getParticipationStatus(eventId, userId) {
    try {
      const [statusResult, countResult] = await Promise.all([
        this.checkUserSubscription(eventId, userId),
        this.getParticipantsCount(eventId)
      ]);

      return {
        success: true,
        data: {
          eventId,
          isRegistered: statusResult.success ? statusResult.data.isSubscribed : false,
          participantsCount: countResult.success ? countResult.data.count : 0,
          canRegister: statusResult.success ? !statusResult.data.isSubscribed : true,
          lastUpdated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: {
          eventId,
          isRegistered: false,
          participantsCount: 0,
          canRegister: false,
          lastUpdated: new Date().toISOString()
        },
        error: handleApiError(error)
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
      return {
        success: false,
        data: new Map(),
        error: handleApiError(error)
      };
    }
  }
}

export default EventService;