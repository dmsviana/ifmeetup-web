import axios from 'axios';

// criar instância do axios
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptor de request para adicionar token
api.interceptors.request.use(
  (config) => {
    // obter token do localStorage
    const token = localStorage.getItem('ifmeetup_auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// interceptor de response para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // se é erro 401 (não autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // limpar dados de autenticação
      localStorage.removeItem('ifmeetup_auth_token');
      localStorage.removeItem('ifmeetup_user_data');
      
      // redirecionar para login se não estiver já na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
    // se é erro 403 (proibido) - sem permissão
    if (error.response?.status === 403) {
      // não redirecionar, apenas retornar erro para tratamento local
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// função para tratar erros da API
export const handleApiError = (error) => {
  // se é erro de resposta do servidor
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          message: data.message || 'Dados inválidos enviados',
          type: 'validation',
          details: data.errors || []
        };
      
      case 401:
        return {
          message: 'Credenciais inválidas ou sessão expirada',
          type: 'authentication'
        };
      
      case 403:
        return {
          message: 'Você não tem permissão para executar esta ação',
          type: 'authorization'
        };
      
      case 404:
        return {
          message: data.message || 'Recurso não encontrado',
          type: 'not_found'
        };
      
      case 409:
        return {
          message: data.message || 'Conflito de dados',
          type: 'conflict'
        };
      
      case 422:
        return {
          message: data.message || 'Dados não puderam ser processados',
          type: 'unprocessable',
          details: data.errors || []
        };
      
      case 500:
        return {
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          type: 'server_error'
        };
      
      default:
        return {
          message: data.message || `Erro ${status} do servidor`,
          type: 'unknown'
        };
    }
  }
  
  // se é erro de rede/conexão
  if (error.request) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      type: 'network'
    };
  }
  
  // outros erros
  return {
    message: error.message || 'Erro desconhecido',
    type: 'unknown'
  };
};

export default api; 