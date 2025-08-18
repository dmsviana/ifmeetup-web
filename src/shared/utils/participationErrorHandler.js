// utilitário para tratamento abrangente de erros de participação
// centraliza toda a lógica de categorização, mensagens e ações de recuperação

import { z } from 'zod';

// enum para categorias de erro
export const ErrorCategoryEnum = z.enum([
  'NETWORK_ERROR',
  'AUTHENTICATION_ERROR', 
  'AUTHORIZATION_ERROR',
  'VALIDATION_ERROR',
  'BUSINESS_LOGIC_ERROR',
  'SERVER_ERROR',
  'TIMEOUT_ERROR',
  'RATE_LIMIT_ERROR',
  'MAINTENANCE_ERROR',
  'UNKNOWN_ERROR'
]);

// enum para severidade do erro
export const ErrorSeverityEnum = z.enum([
  'LOW',      // erro que não impede uso básico
  'MEDIUM',   // erro que limita funcionalidade
  'HIGH',     // erro que impede operação principal
  'CRITICAL'  // erro que quebra a aplicação
]);

// enum para ações de recuperação
export const RecoveryActionEnum = z.enum([
  'RETRY',
  'REFRESH_PAGE',
  'LOGIN_AGAIN',
  'CONTACT_SUPPORT',
  'WAIT_AND_RETRY',
  'CHECK_CONNECTION',
  'NONE'
]);

// schema para erro estruturado
export const StructuredErrorSchema = z.object({
  category: ErrorCategoryEnum,
  severity: ErrorSeverityEnum,
  code: z.string().optional(),
  message: z.string(),
  userMessage: z.string(),
  technicalDetails: z.string().optional(),
  recoveryAction: RecoveryActionEnum,
  recoveryInstructions: z.string().optional().nullable(),
  canRetry: z.boolean().default(false),
  retryDelay: z.number().optional(), // em milissegundos
  maxRetries: z.number().optional(),
  timestamp: z.string(),
  context: z.record(z.any()).optional()
});

// mapeamento de códigos de erro HTTP para categorias
const HTTP_ERROR_MAPPING = {
  400: { category: 'VALIDATION_ERROR', severity: 'MEDIUM' },
  401: { category: 'AUTHENTICATION_ERROR', severity: 'HIGH' },
  403: { category: 'AUTHORIZATION_ERROR', severity: 'HIGH' },
  404: { category: 'VALIDATION_ERROR', severity: 'MEDIUM' },
  408: { category: 'TIMEOUT_ERROR', severity: 'MEDIUM' },
  409: { category: 'BUSINESS_LOGIC_ERROR', severity: 'MEDIUM' },
  422: { category: 'BUSINESS_LOGIC_ERROR', severity: 'MEDIUM' },
  429: { category: 'RATE_LIMIT_ERROR', severity: 'MEDIUM' },
  500: { category: 'SERVER_ERROR', severity: 'HIGH' },
  502: { category: 'SERVER_ERROR', severity: 'HIGH' },
  503: { category: 'MAINTENANCE_ERROR', severity: 'HIGH' },
  504: { category: 'TIMEOUT_ERROR', severity: 'HIGH' }
};

// mapeamento de tipos de erro específicos de participação
const PARTICIPATION_ERROR_MAPPING = {
  'already_registered': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'LOW',
    userMessage: 'Você já está inscrito neste evento',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'event_full': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'MEDIUM',
    userMessage: 'Este evento está lotado. Tente se inscrever em outros eventos similares.',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'not_registered': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'LOW',
    userMessage: 'Você não está inscrito neste evento',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'event_started': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'MEDIUM',
    userMessage: 'Não é possível cancelar a inscrição após o início do evento',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'event_closed': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'MEDIUM',
    userMessage: 'As inscrições para este evento foram encerradas',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'no_permission': {
    category: 'AUTHORIZATION_ERROR',
    severity: 'HIGH',
    userMessage: 'Você não tem permissão para realizar esta ação',
    recoveryAction: 'LOGIN_AGAIN',
    recoveryInstructions: 'Faça login novamente ou entre em contato com o administrador',
    canRetry: false
  },
  'invalid_status': {
    category: 'VALIDATION_ERROR',
    severity: 'MEDIUM',
    userMessage: 'Status de participação inválido',
    recoveryAction: 'REFRESH_PAGE',
    recoveryInstructions: 'Recarregue a página e tente novamente',
    canRetry: true
  },
  'feedback_not_allowed': {
    category: 'BUSINESS_LOGIC_ERROR',
    severity: 'LOW',
    userMessage: 'Feedback só pode ser fornecido após o término do evento',
    recoveryAction: 'NONE',
    canRetry: false
  },
  'network_error': {
    category: 'NETWORK_ERROR',
    severity: 'HIGH',
    userMessage: 'Problema de conexão com o servidor',
    recoveryAction: 'CHECK_CONNECTION',
    recoveryInstructions: 'Verifique sua conexão com a internet e tente novamente',
    canRetry: true,
    retryDelay: 2000,
    maxRetries: 3
  },
  'server_error': {
    category: 'SERVER_ERROR',
    severity: 'HIGH',
    userMessage: 'Erro interno do servidor',
    recoveryAction: 'WAIT_AND_RETRY',
    recoveryInstructions: 'Tente novamente em alguns minutos. Se o problema persistir, entre em contato com o suporte.',
    canRetry: true,
    retryDelay: 5000,
    maxRetries: 2
  },
  'timeout_error': {
    category: 'TIMEOUT_ERROR',
    severity: 'MEDIUM',
    userMessage: 'A operação demorou mais que o esperado',
    recoveryAction: 'RETRY',
    recoveryInstructions: 'Tente novamente. Se o problema persistir, verifique sua conexão.',
    canRetry: true,
    retryDelay: 1000,
    maxRetries: 3
  },
  'rate_limit_error': {
    category: 'RATE_LIMIT_ERROR',
    severity: 'MEDIUM',
    userMessage: 'Muitas tentativas em pouco tempo',
    recoveryAction: 'WAIT_AND_RETRY',
    recoveryInstructions: 'Aguarde alguns segundos antes de tentar novamente',
    canRetry: true,
    retryDelay: 10000,
    maxRetries: 1
  }
};

// mensagens amigáveis para diferentes contextos
const CONTEXT_MESSAGES = {
  registration: {
    loading: 'Processando sua inscrição...',
    success: 'Inscrição realizada com sucesso!',
    networkError: 'Não foi possível processar sua inscrição devido a problemas de conexão',
    serverError: 'Erro no servidor ao processar inscrição. Tente novamente.',
    validationError: 'Dados de inscrição inválidos. Recarregue a página e tente novamente.'
  },
  cancellation: {
    loading: 'Cancelando sua inscrição...',
    success: 'Inscrição cancelada com sucesso!',
    networkError: 'Não foi possível cancelar sua inscrição devido a problemas de conexão',
    serverError: 'Erro no servidor ao cancelar inscrição. Tente novamente.',
    validationError: 'Erro ao validar cancelamento. Recarregue a página e tente novamente.'
  },
  statusCheck: {
    loading: 'Verificando status de participação...',
    networkError: 'Não foi possível verificar seu status de participação',
    serverError: 'Erro ao carregar informações de participação',
    validationError: 'Dados de participação inconsistentes. Recarregue a página.'
  },
  participantsList: {
    loading: 'Carregando lista de participantes...',
    networkError: 'Não foi possível carregar a lista de participantes',
    serverError: 'Erro ao carregar participantes',
    validationError: 'Dados de participantes inconsistentes'
  },
  feedback: {
    loading: 'Enviando seu feedback...',
    success: 'Feedback enviado com sucesso!',
    networkError: 'Não foi possível enviar seu feedback devido a problemas de conexão',
    serverError: 'Erro no servidor ao enviar feedback. Tente novamente.',
    validationError: 'Feedback inválido. Verifique se tem pelo menos 10 caracteres.'
  }
};

/**
 * Classe principal para tratamento de erros de participação
 */
export class ParticipationErrorHandler {
  /**
   * Processa um erro bruto e retorna erro estruturado
   * @param {Error|Object} rawError - erro original
   * @param {string} context - contexto da operação (registration, cancellation, etc.)
   * @param {Object} additionalInfo - informações adicionais
   * @returns {Object} erro estruturado
   */
  static processError(rawError, context = 'unknown', additionalInfo = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      // se já é um erro estruturado, apenas adicionar contexto
      if (rawError && typeof rawError === 'object' && rawError.category) {
        return {
          ...rawError,
          context: { ...rawError.context, operation: context, ...additionalInfo },
          timestamp
        };
      }

      let structuredError = {
        category: 'UNKNOWN_ERROR',
        severity: 'MEDIUM',
        message: 'Erro desconhecido',
        userMessage: 'Ocorreu um erro inesperado',
        recoveryAction: 'RETRY',
        canRetry: true,
        timestamp,
        context: { operation: context, ...additionalInfo }
      };

      // processar erro de resposta HTTP
      if (rawError?.response) {
        structuredError = ParticipationErrorHandler._processHttpError(rawError, context);
      }
      // processar erro de rede
      else if (rawError?.request) {
        structuredError = ParticipationErrorHandler._processNetworkError(rawError, context);
      }
      // processar erro de tipo específico de participação
      else if (rawError?.type && PARTICIPATION_ERROR_MAPPING[rawError.type]) {
        structuredError = ParticipationErrorHandler._processParticipationError(rawError, context);
      }
      // processar erro genérico
      else {
        structuredError = ParticipationErrorHandler._processGenericError(rawError, context);
      }

      // adicionar contexto e timestamp
      structuredError.timestamp = timestamp;
      structuredError.context = { operation: context, ...additionalInfo };

      // validar estrutura final
      return StructuredErrorSchema.parse(structuredError);

    } catch (processingError) {
      console.error('Erro ao processar erro:', processingError);
      
      // retornar erro básico se processamento falhar
      return {
        category: 'UNKNOWN_ERROR',
        severity: 'HIGH',
        message: 'Erro no processamento de erro',
        userMessage: 'Ocorreu um erro inesperado. Tente recarregar a página.',
        recoveryAction: 'REFRESH_PAGE',
        canRetry: false,
        timestamp: new Date().toISOString(),
        context: { operation: context, processingError: processingError.message }
      };
    }
  }

  /**
   * Processa erro de resposta HTTP
   */
  static _processHttpError(error, context) {
    const status = error.response.status;
    const data = error.response.data || {};
    
    const mapping = HTTP_ERROR_MAPPING[status] || { 
      category: 'SERVER_ERROR', 
      severity: 'HIGH' 
    };

    let userMessage = data.message || `Erro ${status} do servidor`;
    let recoveryAction = 'RETRY';
    let recoveryInstructions = null;
    let canRetry = true;

    // personalizar mensagem baseada no contexto
    if (CONTEXT_MESSAGES[context]) {
      const contextMessages = CONTEXT_MESSAGES[context];
      
      switch (mapping.category) {
        case 'NETWORK_ERROR':
          userMessage = contextMessages.networkError || userMessage;
          break;
        case 'SERVER_ERROR':
          userMessage = contextMessages.serverError || userMessage;
          break;
        case 'VALIDATION_ERROR':
          userMessage = contextMessages.validationError || userMessage;
          break;
      }
    }

    // ajustar ação de recuperação baseada no status
    switch (status) {
      case 401:
        recoveryAction = 'LOGIN_AGAIN';
        recoveryInstructions = 'Sua sessão expirou. Faça login novamente.';
        canRetry = false;
        break;
      case 403:
        recoveryAction = 'CONTACT_SUPPORT';
        recoveryInstructions = 'Entre em contato com o administrador se acredita que deveria ter acesso.';
        canRetry = false;
        break;
      case 404:
        recoveryAction = 'REFRESH_PAGE';
        recoveryInstructions = 'O recurso pode ter sido removido. Recarregue a página.';
        canRetry = false;
        break;
      case 429:
        recoveryAction = 'WAIT_AND_RETRY';
        recoveryInstructions = 'Aguarde alguns segundos antes de tentar novamente.';
        break;
      case 500:
      case 502:
      case 503:
        recoveryAction = 'WAIT_AND_RETRY';
        recoveryInstructions = 'Problema temporário no servidor. Tente novamente em alguns minutos.';
        break;
    }

    return {
      category: mapping.category,
      severity: mapping.severity,
      code: `HTTP_${status}`,
      message: data.message || `HTTP ${status} Error`,
      userMessage,
      technicalDetails: JSON.stringify({ status, data: data.errors || data }),
      recoveryAction,
      recoveryInstructions,
      canRetry,
      retryDelay: status >= 500 ? 5000 : 2000,
      maxRetries: status >= 500 ? 2 : 3
    };
  }

  /**
   * Processa erro de rede
   */
  static _processNetworkError(error, context) {
    const contextMessages = CONTEXT_MESSAGES[context];
    
    return {
      category: 'NETWORK_ERROR',
      severity: 'HIGH',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage: contextMessages?.networkError || 'Problema de conexão com o servidor',
      technicalDetails: error.message,
      recoveryAction: 'CHECK_CONNECTION',
      recoveryInstructions: 'Verifique sua conexão com a internet e tente novamente',
      canRetry: true,
      retryDelay: 2000,
      maxRetries: 3
    };
  }

  /**
   * Processa erro específico de participação
   */
  static _processParticipationError(error, context) {
    const mapping = PARTICIPATION_ERROR_MAPPING[error.type];
    
    if (!mapping) {
      return ParticipationErrorHandler._processGenericError(error, context);
    }

    return {
      category: mapping.category,
      severity: mapping.severity,
      code: error.type.toUpperCase(),
      message: error.message || mapping.userMessage,
      userMessage: mapping.userMessage,
      technicalDetails: error.details ? JSON.stringify(error.details) : undefined,
      recoveryAction: mapping.recoveryAction,
      recoveryInstructions: mapping.recoveryInstructions,
      canRetry: mapping.canRetry,
      retryDelay: mapping.retryDelay,
      maxRetries: mapping.maxRetries
    };
  }

  /**
   * Processa erro genérico
   */
  static _processGenericError(error, context) {
    const contextMessages = CONTEXT_MESSAGES[context];
    
    return {
      category: 'UNKNOWN_ERROR',
      severity: 'MEDIUM',
      code: 'GENERIC_ERROR',
      message: error?.message || 'Unknown error',
      userMessage: 'Ocorreu um erro inesperado',
      technicalDetails: error?.stack || JSON.stringify(error),
      recoveryAction: 'RETRY',
      recoveryInstructions: 'Tente novamente. Se o problema persistir, recarregue a página.',
      canRetry: true,
      retryDelay: 1000,
      maxRetries: 2
    };
  }

  /**
   * Determina se um erro deve ser reportado para monitoramento
   */
  static shouldReport(structuredError) {
    // reportar erros críticos e de servidor
    if (structuredError.severity === 'CRITICAL' || structuredError.severity === 'HIGH') {
      return true;
    }

    // reportar erros de servidor e desconhecidos
    if (structuredError.category === 'SERVER_ERROR' || structuredError.category === 'UNKNOWN_ERROR') {
      return true;
    }

    return false;
  }

  /**
   * Gera ID único para o erro (útil para rastreamento)
   */
  static generateErrorId(structuredError) {
    const timestamp = Date.now();
    const category = structuredError.category.substring(0, 3);
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${category}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Formata erro para exibição ao usuário
   */
  static formatForUser(structuredError, includeRecovery = true) {
    let message = structuredError.userMessage;

    if (includeRecovery && structuredError.recoveryInstructions) {
      message += `\n\n${structuredError.recoveryInstructions}`;
    }

    return {
      message,
      severity: structuredError.severity,
      canRetry: structuredError.canRetry,
      recoveryAction: structuredError.recoveryAction
    };
  }

  /**
   * Formata erro para logging técnico
   */
  static formatForLogging(structuredError) {
    return {
      id: this.generateErrorId(structuredError),
      category: structuredError.category,
      severity: structuredError.severity,
      code: structuredError.code,
      message: structuredError.message,
      technicalDetails: structuredError.technicalDetails,
      context: structuredError.context,
      timestamp: structuredError.timestamp,
      canRetry: structuredError.canRetry,
      recoveryAction: structuredError.recoveryAction
    };
  }

  /**
   * Cria mensagem de fallback para quando dados não podem ser carregados
   */
  static createFallbackMessage(context, error = null) {
    const fallbackMessages = {
      registration: {
        title: 'Não foi possível carregar informações de inscrição',
        description: 'Tente recarregar a página ou entre em contato com o suporte se o problema persistir.',
        action: 'Recarregar página'
      },
      participantsList: {
        title: 'Não foi possível carregar lista de participantes',
        description: 'Verifique sua conexão e tente novamente.',
        action: 'Tentar novamente'
      },
      eventDetails: {
        title: 'Não foi possível carregar detalhes do evento',
        description: 'O evento pode ter sido removido ou você pode não ter permissão para visualizá-lo.',
        action: 'Voltar à lista de eventos'
      },
      statusCheck: {
        title: 'Não foi possível verificar status de participação',
        description: 'Algumas funcionalidades podem estar limitadas.',
        action: 'Tentar novamente'
      }
    };

    const fallback = fallbackMessages[context] || fallbackMessages.statusCheck;

    if (error) {
      const structuredError = this.processError(error, context);
      
      // personalizar mensagem baseada no tipo de erro
      if (structuredError.category === 'NETWORK_ERROR') {
        fallback.description = 'Verifique sua conexão com a internet e tente novamente.';
      } else if (structuredError.category === 'AUTHORIZATION_ERROR') {
        fallback.description = 'Você pode não ter permissão para acessar estas informações.';
      } else if (structuredError.category === 'SERVER_ERROR') {
        fallback.description = 'Problema temporário no servidor. Tente novamente em alguns minutos.';
      }
    }

    return fallback;
  }
}

// funções utilitárias exportadas
export const processParticipationError = ParticipationErrorHandler.processError;
export const shouldReportError = ParticipationErrorHandler.shouldReport;
export const generateErrorId = ParticipationErrorHandler.generateErrorId;
export const formatErrorForUser = ParticipationErrorHandler.formatForUser;
export const formatErrorForLogging = ParticipationErrorHandler.formatForLogging;
export const createFallbackMessage = ParticipationErrorHandler.createFallbackMessage;

export default ParticipationErrorHandler;