import api, { handleApiError } from '../../services/httpClient';

// chaves para localStorage
const TOKEN_KEY = 'ifmeetup_auth_token';
const USER_KEY = 'ifmeetup_user_data';

class AuthService {
  // fazer login tradicional
  static async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return this.handleAuthResponse(response);
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  // fazer login via SUAP
  static async loginWithSuap(credentials) {
    try {
      const response = await api.post('/auth/suap/login', credentials);
      return this.handleAuthResponse(response);
    } catch (error) {
      return this.handleAuthError(error, 'suap');
    }
  }

  // fazer logout
  static async logout() {
    try {
      // tentar invalidar token no servidor
      await api.post('/auth/logout');
    } catch (error) {
      // log do erro mas continua o logout local
      console.warn('Erro ao invalidar token no servidor:', error);
    } finally {
      // sempre limpar dados locais
      this.clearAuthData();
    }
  }

  // obter usuário atual
  static async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      // verificar se token ainda é válido
      if (this.isTokenExpired(token)) {
        this.clearAuthData();
        return null;
      }

      // buscar dados atualizados do usuário
      const userData = this.getUserData();
      if (userData) {
        return {
          ...userData,
          permissions: this.extractPermissionsFromToken(token),
          roles: this.extractRolesFromToken(token)
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      this.clearAuthData();
      return null;
    }
  }

  // verificar se tem permissão
  static hasPermission(permission) {
    const token = this.getToken();
    if (!token) return false;

    const permissions = this.extractPermissionsFromToken(token);
    return permissions.includes(permission) || permissions.includes('ADMIN_ACCESS');
  }

  // verificar se tem role
  static hasRole(role) {
    const token = this.getToken();
    if (!token) return false;

    const roles = this.extractRolesFromToken(token);
    return roles.includes(role);
  }

  // gerenciamento de token
  static setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  static removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // gerenciamento de dados do usuário
  static setUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }

  static getUserData() {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  }

  static removeUserData() {
    localStorage.removeItem(USER_KEY);
  }

  // limpar todos os dados de autenticação
  static clearAuthData() {
    this.removeToken();
    this.removeUserData();
  }

  // extrair permissões da resposta de login
  static extractPermissions(loginResponse) {
    // priorizar permissões da resposta direta
    if (loginResponse.permissions) {
      return loginResponse.permissions;
    }

    // caso contrário, extrair do token
    if (loginResponse.token) {
      return this.extractPermissionsFromToken(loginResponse.token);
    }

    return [];
  }

  // extrair roles da resposta de login
  static extractRoles(loginResponse) {
    // priorizar roles da resposta direta
    if (loginResponse.roles) {
      return loginResponse.roles;
    }

    // caso contrário, extrair do usuário ou token
    if (loginResponse.user && loginResponse.user.roles) {
      return loginResponse.user.roles;
    }

    if (loginResponse.token) {
      return this.extractRolesFromToken(loginResponse.token);
    }

    return [];
  }

  // extrair permissões do JWT token
  static extractPermissionsFromToken(token) {
    try {
      const payload = this.decodeTokenPayload(token);
      return payload.permissions || [];
    } catch (error) {
      console.error('Erro ao extrair permissões do token:', error);
      return [];
    }
  }

  // extrair roles do JWT token
  static extractRolesFromToken(token) {
    try {
      const payload = this.decodeTokenPayload(token);
      return payload.roles || payload.authorities || [];
    } catch (error) {
      console.error('Erro ao extrair roles do token:', error);
      return [];
    }
  }

  // decodificar payload do JWT
  static decodeTokenPayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Erro ao decodificar token JWT:', error);
      throw error;
    }
  }

  // verificar se token expirou
  static isTokenExpired(token) {
    try {
      const payload = this.decodeTokenPayload(token);
      if (!payload.exp) {
        return false; // sem expiração definida
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true; // assumir expirado em caso de erro
    }
  }

  // tratamento unificado de resposta de autenticação
  static handleAuthResponse(response) {
    if (response.data.token && response.data.user) {
      // salvar token e dados do usuário
      this.setToken(response.data.token);
      this.setUserData(response.data.user);

      // extrair permissões e roles do token ou resposta
      const permissions = this.extractPermissions(response.data);
      const roles = this.extractRoles(response.data);

      return {
        success: true,
        data: {
          user: response.data.user,
          token: response.data.token,
          permissions,
          roles
        },
        error: null
      };
    } else {
      throw new Error('Resposta de login inválida do servidor');
    }
  }

  // tratamento unificado de erro de autenticação
  static handleAuthError(error, loginType = 'traditional') {
    const baseError = handleApiError(error);

    // mapeamento específico para erros SUAP
    if (loginType === 'suap' && error.response?.data?.errorCode) {
      const suapError = this.mapSuapError(error.response.data.errorCode);
      return {
        success: false,
        data: null,
        error: {
          ...baseError,
          message: suapError.message,
          type: 'suap_error',
          errorCode: error.response.data.errorCode
        }
      };
    }

    return {
      success: false,
      data: null,
      error: baseError
    };
  }

  // mapeamento de códigos de erro SUAP para mensagens amigáveis
  static mapSuapError(errorCode) {
    const SUAP_ERROR_MESSAGES = {
      'SUAP_INVALID_CREDENTIALS': {
        message: 'Matrícula ou senha incorreta. Verifique suas credenciais SUAP.',
        suggestion: 'Confirme se sua matrícula e senha estão corretas.'
      },
      'SUAP_USER_NOT_FOUND': {
        message: 'Usuário não encontrado no SUAP. Verifique se sua matrícula está correta.',
        suggestion: 'Confirme se sua matrícula está digitada corretamente.'
      },
      'SUAP_TIMEOUT': {
        message: 'O SUAP está demorando para responder. Tente novamente em alguns minutos.',
        suggestion: 'Aguarde alguns minutos e tente novamente.'
      },
      'SUAP_TEMPORARILY_UNAVAILABLE': {
        message: 'O SUAP está temporariamente indisponível. Tente novamente mais tarde.',
        suggestion: 'Você pode tentar fazer login tradicional ou aguardar o SUAP voltar ao normal.'
      },
      'SUAP_CONNECTION_ERROR': {
        message: 'Erro de conexão com o SUAP. Verifique sua internet.',
        suggestion: 'Verifique sua conexão com a internet e tente novamente.'
      }
    };

    return SUAP_ERROR_MESSAGES[errorCode] || {
      message: 'Erro desconhecido no SUAP. Tente novamente.',
      suggestion: 'Se o problema persistir, entre em contato com o suporte.'
    };
  }
}

export default AuthService; 