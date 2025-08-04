// componentes de fallback para quando dados de participação falham ao carregar
// fornece estados de erro amigáveis com opções de recuperação

import React from 'react';
import { 
  AlertCircle, 
  Wifi, 
  RefreshCw, 
  Home, 
  Users, 
  Calendar,
  Shield,
  Server,
  Clock,
  HelpCircle
} from 'lucide-react';

// componente base para fallbacks de erro
const BaseFallback = ({ 
  icon: Icon = AlertCircle,
  title,
  description,
  actions = [],
  severity = 'medium',
  className = ''
}) => {
  const severityStyles = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200', 
    high: 'bg-red-50 border-red-200',
    critical: 'bg-red-100 border-red-300'
  };

  const iconStyles = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500', 
    critical: 'text-red-600'
  };

  return (
    <div className={`rounded-lg border-2 border-dashed p-6 text-center ${severityStyles[severity]} ${className}`}>
      <Icon className={`w-12 h-12 mx-auto mb-4 ${iconStyles[severity]}`} />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                action.variant === 'primary'
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-gray-400'
                  : action.variant === 'secondary'
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 disabled:bg-gray-100'
                  : 'text-green-600 hover:text-green-700 focus:ring-green-500 disabled:text-gray-400'
              } ${action.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// fallback para erro de conexão de rede
export const NetworkErrorFallback = ({ 
  onRetry, 
  isRetrying = false,
  context = 'participação',
  className = '' 
}) => {
  const actions = [
    {
      label: isRetrying ? 'Tentando...' : 'Tentar novamente',
      onClick: onRetry,
      disabled: isRetrying,
      variant: 'primary',
      icon: RefreshCw
    }
  ];

  return (
    <BaseFallback
      icon={Wifi}
      title="Problema de conexão"
      description={`Não foi possível carregar informações de ${context} devido a problemas de rede. Verifique sua conexão com a internet.`}
      actions={actions}
      severity="high"
      className={className}
    />
  );
};

// fallback para erro de servidor
export const ServerErrorFallback = ({ 
  onRetry, 
  onGoHome,
  isRetrying = false,
  context = 'participação',
  className = '' 
}) => {
  const actions = [
    {
      label: isRetrying ? 'Tentando...' : 'Tentar novamente',
      onClick: onRetry,
      disabled: isRetrying,
      variant: 'primary',
      icon: RefreshCw
    }
  ];

  if (onGoHome) {
    actions.push({
      label: 'Voltar ao início',
      onClick: onGoHome,
      variant: 'secondary',
      icon: Home
    });
  }

  return (
    <BaseFallback
      icon={Server}
      title="Erro no servidor"
      description={`Problema temporário no servidor ao carregar ${context}. Tente novamente em alguns minutos.`}
      actions={actions}
      severity="high"
      className={className}
    />
  );
};

// fallback para erro de autorização
export const AuthorizationErrorFallback = ({ 
  onLogin,
  onGoHome,
  context = 'participação',
  className = '' 
}) => {
  const actions = [];

  if (onLogin) {
    actions.push({
      label: 'Fazer login',
      onClick: onLogin,
      variant: 'primary',
      icon: Shield
    });
  }

  if (onGoHome) {
    actions.push({
      label: 'Voltar ao início',
      onClick: onGoHome,
      variant: 'secondary',
      icon: Home
    });
  }

  return (
    <BaseFallback
      icon={Shield}
      title="Acesso negado"
      description={`Você não tem permissão para acessar informações de ${context}. Faça login ou entre em contato com o administrador.`}
      actions={actions}
      severity="medium"
      className={className}
    />
  );
};

// fallback para timeout
export const TimeoutErrorFallback = ({ 
  onRetry,
  isRetrying = false,
  context = 'participação',
  className = '' 
}) => {
  const actions = [
    {
      label: isRetrying ? 'Tentando...' : 'Tentar novamente',
      onClick: onRetry,
      disabled: isRetrying,
      variant: 'primary',
      icon: RefreshCw
    }
  ];

  return (
    <BaseFallback
      icon={Clock}
      title="Operação demorou muito"
      description={`O carregamento de ${context} está demorando mais que o esperado. Tente novamente.`}
      actions={actions}
      severity="medium"
      className={className}
    />
  );
};

// fallback para dados não encontrados
export const NotFoundFallback = ({ 
  onGoBack,
  onGoHome,
  context = 'evento',
  className = '' 
}) => {
  const actions = [];

  if (onGoBack) {
    actions.push({
      label: 'Voltar',
      onClick: onGoBack,
      variant: 'primary'
    });
  }

  if (onGoHome) {
    actions.push({
      label: 'Ir para início',
      onClick: onGoHome,
      variant: 'secondary',
      icon: Home
    });
  }

  return (
    <BaseFallback
      icon={HelpCircle}
      title={`${context} não encontrado`}
      description={`O ${context} que você está procurando pode ter sido removido ou você pode não ter permissão para visualizá-lo.`}
      actions={actions}
      severity="medium"
      className={className}
    />
  );
};

// fallback específico para lista de participantes vazia
export const EmptyParticipantsFallback = ({ 
  eventTitle,
  isOrganizer = false,
  onRefresh,
  className = '' 
}) => {
  const actions = [];

  if (onRefresh) {
    actions.push({
      label: 'Atualizar',
      onClick: onRefresh,
      variant: 'secondary',
      icon: RefreshCw
    });
  }

  return (
    <BaseFallback
      icon={Users}
      title="Nenhum participante ainda"
      description={
        isOrganizer 
          ? `Ainda não há participantes inscritos em "${eventTitle}". Compartilhe o evento para atrair mais pessoas.`
          : `Este evento ainda não possui participantes inscritos.`
      }
      actions={actions}
      severity="low"
      className={className}
    />
  );
};

// fallback para evento lotado
export const EventFullFallback = ({ 
  eventTitle,
  maxParticipants,
  onViewSimilar,
  onNotifyWhenAvailable,
  className = '' 
}) => {
  const actions = [];

  if (onViewSimilar) {
    actions.push({
      label: 'Ver eventos similares',
      onClick: onViewSimilar,
      variant: 'primary',
      icon: Calendar
    });
  }

  if (onNotifyWhenAvailable) {
    actions.push({
      label: 'Notificar se houver vaga',
      onClick: onNotifyWhenAvailable,
      variant: 'secondary'
    });
  }

  return (
    <BaseFallback
      icon={Users}
      title="Evento lotado"
      description={`"${eventTitle}" atingiu sua capacidade máxima de ${maxParticipants} participantes. Explore outros eventos disponíveis.`}
      actions={actions}
      severity="medium"
      className={className}
    />
  );
};

// fallback para evento encerrado
export const EventClosedFallback = ({ 
  eventTitle,
  reason = 'encerrado',
  onViewSimilar,
  className = '' 
}) => {
  const actions = [];

  if (onViewSimilar) {
    actions.push({
      label: 'Ver outros eventos',
      onClick: onViewSimilar,
      variant: 'primary',
      icon: Calendar
    });
  }

  const reasonMessages = {
    encerrado: 'As inscrições foram encerradas',
    cancelado: 'O evento foi cancelado',
    concluido: 'O evento já foi concluído',
    iniciado: 'O evento já começou'
  };

  return (
    <BaseFallback
      icon={Calendar}
      title={`Evento ${reason}`}
      description={`"${eventTitle}" - ${reasonMessages[reason] || 'Não é mais possível se inscrever'}. Explore outros eventos disponíveis.`}
      actions={actions}
      severity="medium"
      className={className}
    />
  );
};

// fallback genérico para erro desconhecido
export const UnknownErrorFallback = ({ 
  onRetry,
  onRefreshPage,
  onContactSupport,
  isRetrying = false,
  context = 'dados',
  className = '' 
}) => {
  const actions = [];

  if (onRetry) {
    actions.push({
      label: isRetrying ? 'Tentando...' : 'Tentar novamente',
      onClick: onRetry,
      disabled: isRetrying,
      variant: 'primary',
      icon: RefreshCw
    });
  }

  if (onRefreshPage) {
    actions.push({
      label: 'Recarregar página',
      onClick: onRefreshPage,
      variant: 'secondary'
    });
  }

  if (onContactSupport) {
    actions.push({
      label: 'Contatar suporte',
      onClick: onContactSupport,
      variant: 'link'
    });
  }

  return (
    <BaseFallback
      icon={AlertCircle}
      title="Erro inesperado"
      description={`Ocorreu um erro inesperado ao carregar ${context}. Tente novamente ou entre em contato com o suporte se o problema persistir.`}
      actions={actions}
      severity="high"
      className={className}
    />
  );
};

// componente inteligente que escolhe o fallback apropriado baseado no erro
export const SmartParticipationFallback = ({ 
  error,
  context = 'participação',
  onRetry,
  onGoHome,
  onLogin,
  onRefreshPage,
  onContactSupport,
  isRetrying = false,
  className = ''
}) => {
  if (!error) {
    return (
      <UnknownErrorFallback
        onRetry={onRetry}
        onRefreshPage={onRefreshPage}
        onContactSupport={onContactSupport}
        isRetrying={isRetrying}
        context={context}
        className={className}
      />
    );
  }

  // se é um erro estruturado, usar categoria
  if (error.category) {
    switch (error.category) {
      case 'NETWORK_ERROR':
        return (
          <NetworkErrorFallback
            onRetry={onRetry}
            isRetrying={isRetrying}
            context={context}
            className={className}
          />
        );

      case 'SERVER_ERROR':
      case 'MAINTENANCE_ERROR':
        return (
          <ServerErrorFallback
            onRetry={onRetry}
            onGoHome={onGoHome}
            isRetrying={isRetrying}
            context={context}
            className={className}
          />
        );

      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
        return (
          <AuthorizationErrorFallback
            onLogin={onLogin}
            onGoHome={onGoHome}
            context={context}
            className={className}
          />
        );

      case 'TIMEOUT_ERROR':
        return (
          <TimeoutErrorFallback
            onRetry={onRetry}
            isRetrying={isRetrying}
            context={context}
            className={className}
          />
        );

      default:
        return (
          <UnknownErrorFallback
            onRetry={onRetry}
            onRefreshPage={onRefreshPage}
            onContactSupport={onContactSupport}
            isRetrying={isRetrying}
            context={context}
            className={className}
          />
        );
    }
  }

  // fallback para erros não estruturados
  if (error.response?.status === 404) {
    return (
      <NotFoundFallback
        onGoHome={onGoHome}
        context={context}
        className={className}
      />
    );
  }

  if (error.response?.status >= 500) {
    return (
      <ServerErrorFallback
        onRetry={onRetry}
        onGoHome={onGoHome}
        isRetrying={isRetrying}
        context={context}
        className={className}
      />
    );
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return (
      <AuthorizationErrorFallback
        onLogin={onLogin}
        onGoHome={onGoHome}
        context={context}
        className={className}
      />
    );
  }

  if (!error.response && error.request) {
    return (
      <NetworkErrorFallback
        onRetry={onRetry}
        isRetrying={isRetrying}
        context={context}
        className={className}
      />
    );
  }

  // fallback genérico
  return (
    <UnknownErrorFallback
      onRetry={onRetry}
      onRefreshPage={onRefreshPage}
      onContactSupport={onContactSupport}
      isRetrying={isRetrying}
      context={context}
      className={className}
    />
  );
};

export default SmartParticipationFallback;