// serviço dedicado para toast notifications de participação em eventos
// centraliza todas as mensagens e lógica de feedback para operações de participação

// mensagens padronizadas para diferentes cenários de participação
export const PARTICIPATION_TOAST_MESSAGES = {
  // sucessos
  REGISTRATION_SUCCESS: 'Inscrição realizada com sucesso!',
  CANCELLATION_SUCCESS: 'Inscrição cancelada com sucesso!',
  ATTENDANCE_UPDATED: 'Status de presença atualizado com sucesso!',
  FEEDBACK_SUBMITTED: 'Feedback enviado com sucesso!',
  
  // erros de operação
  REGISTRATION_ERROR: 'Erro ao se inscrever. Tente novamente.',
  CANCELLATION_ERROR: 'Erro ao cancelar inscrição. Tente novamente.',
  ATTENDANCE_UPDATE_ERROR: 'Erro ao atualizar presença. Tente novamente.',
  FEEDBACK_ERROR: 'Erro ao enviar feedback. Tente novamente.',
  
  // erros de regra de negócio
  EVENT_FULL: 'Este evento está lotado.',
  EVENT_CLOSED: 'As inscrições para este evento foram encerradas.',
  ALREADY_REGISTERED: 'Você já está inscrito neste evento.',
  NOT_REGISTERED: 'Você não está inscrito neste evento.',
  EVENT_STARTED: 'Não é possível cancelar após o início do evento.',
  EVENT_NOT_FINISHED: 'Feedback só pode ser fornecido após o término do evento.',
  
  // erros de sistema
  NETWORK_ERROR: 'Problema de conexão. Verificando...',
  PERMISSION_ERROR: 'Você não tem permissão para esta ação.',
  LOADING_ERROR: 'Erro ao carregar informações de participação.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique as informações.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente em alguns minutos.',
  
  // estados de carregamento
  REGISTERING: 'Processando inscrição...',
  CANCELLING: 'Cancelando inscrição...',
  UPDATING_ATTENDANCE: 'Atualizando presença...',
  SUBMITTING_FEEDBACK: 'Enviando feedback...',
  LOADING_PARTICIPANTS: 'Carregando participantes...',
  
  // informações gerais
  REGISTRATION_CONFIRMED: 'Sua inscrição foi confirmada!',
  CANCELLATION_CONFIRMED: 'Sua inscrição foi cancelada.',
  EVENT_CAPACITY_WARNING: 'Poucas vagas restantes!',
  SYNC_SUCCESS: 'Dados sincronizados com sucesso.',
  OFFLINE_MODE: 'Modo offline ativo. Algumas funcionalidades podem estar limitadas.'
};

// tipos de toast para diferentes contextos
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// durações específicas para diferentes tipos de mensagem
export const TOAST_DURATIONS = {
  SUCCESS: 4000,      // 4 segundos para sucessos
  ERROR: 6000,        // 6 segundos para erros (mais tempo para ler)
  WARNING: 5000,      // 5 segundos para avisos
  INFO: 3000,         // 3 segundos para informações
  LOADING: 0,         // sem timeout para loading (removido manualmente)
  CRITICAL: 8000      // 8 segundos para erros críticos
};

class ParticipationToastService {
  constructor(toastContext) {
    this.toast = toastContext;
  }

  // métodos para diferentes tipos de feedback

  // sucessos
  showRegistrationSuccess() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.REGISTRATION_SUCCESS,
      TOAST_DURATIONS.SUCCESS
    );
  }

  showCancellationSuccess() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.CANCELLATION_SUCCESS,
      TOAST_DURATIONS.SUCCESS
    );
  }

  showAttendanceUpdated() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.ATTENDANCE_UPDATED,
      TOAST_DURATIONS.SUCCESS
    );
  }

  showFeedbackSubmitted() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.FEEDBACK_SUBMITTED,
      TOAST_DURATIONS.SUCCESS
    );
  }

  // erros de operação
  showRegistrationError(customMessage = null) {
    const message = customMessage || PARTICIPATION_TOAST_MESSAGES.REGISTRATION_ERROR;
    return this.toast.error(message, TOAST_DURATIONS.ERROR);
  }

  showCancellationError(customMessage = null) {
    const message = customMessage || PARTICIPATION_TOAST_MESSAGES.CANCELLATION_ERROR;
    return this.toast.error(message, TOAST_DURATIONS.ERROR);
  }

  showAttendanceUpdateError(customMessage = null) {
    const message = customMessage || PARTICIPATION_TOAST_MESSAGES.ATTENDANCE_UPDATE_ERROR;
    return this.toast.error(message, TOAST_DURATIONS.ERROR);
  }

  showFeedbackError(customMessage = null) {
    const message = customMessage || PARTICIPATION_TOAST_MESSAGES.FEEDBACK_ERROR;
    return this.toast.error(message, TOAST_DURATIONS.ERROR);
  }

  // erros de regra de negócio
  showEventFull() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.EVENT_FULL,
      TOAST_DURATIONS.WARNING
    );
  }

  showEventClosed() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.EVENT_CLOSED,
      TOAST_DURATIONS.WARNING
    );
  }

  showAlreadyRegistered() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.ALREADY_REGISTERED,
      TOAST_DURATIONS.INFO
    );
  }

  showNotRegistered() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.NOT_REGISTERED,
      TOAST_DURATIONS.WARNING
    );
  }

  showEventStarted() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.EVENT_STARTED,
      TOAST_DURATIONS.WARNING
    );
  }

  showEventNotFinished() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.EVENT_NOT_FINISHED,
      TOAST_DURATIONS.WARNING
    );
  }

  // erros de sistema
  showNetworkError() {
    return this.toast.error(
      PARTICIPATION_TOAST_MESSAGES.NETWORK_ERROR,
      TOAST_DURATIONS.CRITICAL
    );
  }

  showPermissionError() {
    return this.toast.error(
      PARTICIPATION_TOAST_MESSAGES.PERMISSION_ERROR,
      TOAST_DURATIONS.ERROR
    );
  }

  showLoadingError() {
    return this.toast.error(
      PARTICIPATION_TOAST_MESSAGES.LOADING_ERROR,
      TOAST_DURATIONS.ERROR
    );
  }

  showValidationError(customMessage = null) {
    const message = customMessage || PARTICIPATION_TOAST_MESSAGES.VALIDATION_ERROR;
    return this.toast.error(message, TOAST_DURATIONS.ERROR);
  }

  showServerError() {
    return this.toast.error(
      PARTICIPATION_TOAST_MESSAGES.SERVER_ERROR,
      TOAST_DURATIONS.CRITICAL
    );
  }

  // estados de carregamento (sem timeout automático)
  showRegistering() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.REGISTERING,
      TOAST_DURATIONS.LOADING
    );
  }

  showCancelling() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.CANCELLING,
      TOAST_DURATIONS.LOADING
    );
  }

  showUpdatingAttendance() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.UPDATING_ATTENDANCE,
      TOAST_DURATIONS.LOADING
    );
  }

  showSubmittingFeedback() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.SUBMITTING_FEEDBACK,
      TOAST_DURATIONS.LOADING
    );
  }

  showLoadingParticipants() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.LOADING_PARTICIPANTS,
      TOAST_DURATIONS.LOADING
    );
  }

  // informações gerais
  showRegistrationConfirmed() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.REGISTRATION_CONFIRMED,
      TOAST_DURATIONS.SUCCESS
    );
  }

  showCancellationConfirmed() {
    return this.toast.info(
      PARTICIPATION_TOAST_MESSAGES.CANCELLATION_CONFIRMED,
      TOAST_DURATIONS.INFO
    );
  }

  showEventCapacityWarning() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.EVENT_CAPACITY_WARNING,
      TOAST_DURATIONS.WARNING
    );
  }

  showSyncSuccess() {
    return this.toast.success(
      PARTICIPATION_TOAST_MESSAGES.SYNC_SUCCESS,
      TOAST_DURATIONS.INFO
    );
  }

  showOfflineMode() {
    return this.toast.warning(
      PARTICIPATION_TOAST_MESSAGES.OFFLINE_MODE,
      TOAST_DURATIONS.CRITICAL
    );
  }

  // método genérico para erros baseados no tipo de erro da API
  showErrorByType(errorType, customMessage = null) {
    switch (errorType) {
      case 'already_registered':
        return this.showAlreadyRegistered();
      case 'event_full':
        return this.showEventFull();
      case 'not_registered':
        return this.showNotRegistered();
      case 'event_started':
        return this.showEventStarted();
      case 'event_closed':
        return this.showEventClosed();
      case 'no_permission':
        return this.showPermissionError();
      case 'invalid_status':
        return this.showValidationError(customMessage);
      case 'feedback_not_allowed':
        return this.showEventNotFinished();
      case 'network_error':
        return this.showNetworkError();
      case 'server_error':
        return this.showServerError();
      default:
        return this.toast.error(
          customMessage || 'Erro desconhecido. Tente novamente.',
          TOAST_DURATIONS.ERROR
        );
    }
  }

  // método para mostrar toast baseado no resultado de uma operação
  showOperationResult(operation, result, customMessages = {}) {
    if (result.success) {
      switch (operation) {
        case 'register':
          return this.showRegistrationSuccess();
        case 'cancel':
          return this.showCancellationSuccess();
        case 'updateAttendance':
          return this.showAttendanceUpdated();
        case 'submitFeedback':
          return this.showFeedbackSubmitted();
        default:
          return this.toast.success(
            customMessages.success || 'Operação realizada com sucesso!',
            TOAST_DURATIONS.SUCCESS
          );
      }
    } else {
      // usar mensagem customizada se fornecida
      if (customMessages.error) {
        return this.toast.error(customMessages.error, TOAST_DURATIONS.ERROR);
      }

      // usar tipo de erro se disponível
      if (result.error?.type) {
        return this.showErrorByType(result.error.type, result.error.message);
      }

      // fallback para erro genérico da operação
      switch (operation) {
        case 'register':
          return this.showRegistrationError(result.error?.message);
        case 'cancel':
          return this.showCancellationError(result.error?.message);
        case 'updateAttendance':
          return this.showAttendanceUpdateError(result.error?.message);
        case 'submitFeedback':
          return this.showFeedbackError(result.error?.message);
        default:
          return this.toast.error(
            result.error?.message || customMessages.defaultError || 'Erro na operação. Tente novamente.',
            TOAST_DURATIONS.ERROR
          );
      }
    }
  }

  // método para remover toast específico (útil para loading states)
  removeToast(toastId) {
    if (this.toast.removeToast && toastId) {
      this.toast.removeToast(toastId);
    }
  }

  // método para limpar todos os toasts
  clearAll() {
    if (this.toast.clearAll) {
      this.toast.clearAll();
    }
  }

  // método para mostrar toast com configuração customizada
  showCustom(message, type = TOAST_TYPES.INFO, duration = null) {
    const toastDuration = duration || TOAST_DURATIONS[type.toUpperCase()] || TOAST_DURATIONS.INFO;
    
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return this.toast.success(message, toastDuration);
      case TOAST_TYPES.ERROR:
        return this.toast.error(message, toastDuration);
      case TOAST_TYPES.WARNING:
        return this.toast.warning(message, toastDuration);
      case TOAST_TYPES.INFO:
      default:
        return this.toast.info(message, toastDuration);
    }
  }
}

// função helper para criar instância do serviço
export const createParticipationToastService = (toastContext) => {
  return new ParticipationToastService(toastContext);
};

export default ParticipationToastService;