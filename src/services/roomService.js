import api, { handleApiError } from './httpClient';
import { 
  RoomResponseSchema, 
  PageRoomResponseSchema, 
  RoomRequestSchema,
  RoomStatusRequestSchema 
} from '../schemas/roomSchema';

class RoomService {
  // endpoint base
  static BASE_URL = '/rooms';

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

  // listar todas as salas com paginação e ordenação
  static async getAllRooms(params = {}) {
    try {
      const {
        page = 0,
        size = 20,
        sort = 'name',
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
      const validatedData = PageRoomResponseSchema.parse(response.data);
      
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

  // buscar sala por id
  static async getRoomById(id) {
    try {
      if (!id) {
        throw new Error('ID da sala é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/${id}`);
      
      // validar resposta com schema
      const validatedData = RoomResponseSchema.parse(response.data);
      
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

  // criar nova sala
  static async createRoom(roomData) {
    try {
      // validar dados antes de enviar
      const validatedData = RoomRequestSchema.parse(roomData);
      
      const response = await api.post(this.BASE_URL, validatedData);
      
      // validar resposta
      const validatedResponse = RoomResponseSchema.parse(response.data);
      
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

  // atualizar sala existente
  static async updateRoom(id, roomData) {
    try {
      if (!id) {
        throw new Error('ID da sala é obrigatório');
      }

      // validar dados antes de enviar
      const validatedData = RoomRequestSchema.parse(roomData);
      
      const response = await api.put(`${this.BASE_URL}/${id}`, validatedData);
      
      // validar resposta
      const validatedResponse = RoomResponseSchema.parse(response.data);
      
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

  // atualizar status da sala
  static async updateRoomStatus(id, statusData) {
    try {
      if (!id) {
        throw new Error('ID da sala é obrigatório');
      }

      // validar dados antes de enviar
      const validatedData = RoomStatusRequestSchema.parse(statusData);
      
      const response = await api.patch(
        `${this.BASE_URL}/${id}/status`, 
        validatedData
      );
      
      // validar resposta
      const validatedResponse = RoomResponseSchema.parse(response.data);
      
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

  // desabilitar sala (soft delete)
  static async deleteRoom(id) {
    try {
      if (!id) {
        throw new Error('ID da sala é obrigatório');
      }

      await api.delete(`${this.BASE_URL}/${id}`);
      
      return {
        success: true,
        data: { message: 'Sala desabilitada com sucesso' },
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

  // filtrar salas por tipo
  static async getRoomsByType(type) {
    try {
      if (!type) {
        throw new Error('Tipo da sala é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/type/${type}`);
      
      // validar resposta - array de salas
      const validatedData = response.data.map(room => RoomResponseSchema.parse(room));
      
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

  // filtrar salas por status
  static async getRoomsByStatus(status) {
    try {
      if (!status) {
        throw new Error('Status da sala é obrigatório');
      }

      const response = await api.get(`${this.BASE_URL}/status/${status}`);
      
      // validar resposta - array de salas
      const validatedData = response.data.map(room => RoomResponseSchema.parse(room));
      
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

  // filtrar salas por capacidade mínima
  static async getRoomsByMinCapacity(minCapacity) {
    try {
      if (!minCapacity || minCapacity < 1) {
        throw new Error('Capacidade mínima deve ser maior que 0');
      }

      const response = await api.get(`${this.BASE_URL}/capacity/${minCapacity}`);
      
      // validar resposta - array de salas
      const validatedData = response.data.map(room => RoomResponseSchema.parse(room));
      
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

  // filtrar salas por recurso
  static async getRoomsByResource(resourceType, minQuantity = 1) {
    try {
      if (!resourceType) {
        throw new Error('Tipo de recurso é obrigatório');
      }

      const queryString = this.buildQueryParams({ minQuantity });
      const url = `${this.BASE_URL}/resource/${resourceType}?${queryString}`;
      
      const response = await api.get(url);
      
      // validar resposta - array de salas
      const validatedData = response.data.map(room => RoomResponseSchema.parse(room));
      
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

  // buscar salas disponíveis em período
  static async getAvailableRooms(startDateTime, endDateTime) {
    try {
      if (!startDateTime || !endDateTime) {
        throw new Error('Data/hora de início e fim são obrigatórias');
      }

      const queryString = this.buildQueryParams({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });

      const response = await api.get(
        `${this.BASE_URL}/available?${queryString}`
      );
      
      // validar resposta - array de salas
      const validatedData = response.data.map(room => RoomResponseSchema.parse(room));
      
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

  // método helper para busca avançada com múltiplos filtros
  static async searchRooms(filters = {}) {
    try {
      const {
        search,
        type,
        status,
        minCapacity,
        resourceType,
        resourceQuantity,
        startDateTime,
        endDateTime,
        page = 0,
        size = 20,
        sort = 'name',
        direction = 'ASC'
      } = filters;

      // se houver filtro de disponibilidade, usar endpoint específico
      if (startDateTime && endDateTime) {
        return await this.getAvailableRooms(
          new Date(startDateTime), 
          new Date(endDateTime)
        );
      }

      // se houver filtro específico, usar endpoints apropriados
      if (type && !status && !minCapacity && !resourceType) {
        return await this.getRoomsByType(type);
      }

      if (status && !type && !minCapacity && !resourceType) {
        return await this.getRoomsByStatus(status);
      }

      if (minCapacity && !type && !status && !resourceType) {
        return await this.getRoomsByMinCapacity(minCapacity);
      }

      if (resourceType && !type && !status && !minCapacity) {
        return await this.getRoomsByResource(resourceType, resourceQuantity);
      }

      // caso contrário, usar endpoint geral com filtros locais
      const result = await this.getAllRooms({ page, size, sort, direction });
      
      if (!result.success) {
        return result;
      }

      // aplicar filtros locais se necessário
      let filteredRooms = result.data.content;

      if (search) {
        filteredRooms = filteredRooms.filter(room =>
          room.name.toLowerCase().includes(search.toLowerCase()) ||
          room.location?.toLowerCase().includes(search.toLowerCase()) ||
          room.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (type) {
        filteredRooms = filteredRooms.filter(room => room.type === type);
      }

      if (status) {
        filteredRooms = filteredRooms.filter(room => room.status === status);
      }

      if (minCapacity) {
        filteredRooms = filteredRooms.filter(room => room.capacity >= minCapacity);
      }

      if (resourceType) {
        filteredRooms = filteredRooms.filter(room =>
          room.resources?.some(resource =>
            resource.resourceType === resourceType &&
            resource.quantity >= (resourceQuantity || 1)
          )
        );
      }

      return {
        success: true,
        data: {
          ...result.data,
          content: filteredRooms,
          numberOfElements: filteredRooms.length
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
}

export default RoomService; 