import React, { useState, useCallback, useEffect } from 'react';
import { useEventParticipation } from '../../hooks/useEventParticipation';
import { useAuth } from '../../auth/context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { SmartParticipationFallback } from './ParticipationFallback';
import { formatErrorForUser } from '../../utils/participationErrorHandler';

const ParticipationButton = ({
  eventId,
  eventData = null, // dados do evento para validação avançada
  variant = 'primary',
  size = 'medium',
  disabled = false,
  showParticipantsCount = false,
  onStatusChange = null,
  className = '',
  children = null,
  ...props
}) => {
  const { isAuthenticated } = useAuth();
  const [actionFeedback, setActionFeedback] = useState(null); // 'success' | 'error' | null
  
  // usar o hook de participação
  const {
    isRegistered,
    canRegister,
    isLoading,
    error,
    registrationStatus,
    register,
    cancelRegistration,
    getButtonText,
    getButtonVariant,
    getParticipantsText,
    shouldShowParticipantsCount
  } = useEventParticipation(eventId, eventData, {
    onStatusChange: onStatusChange
  });

  // limpar feedback após um tempo
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // handler para clique no botão
  const handleClick = useCallback(async (event) => {
    event.preventDefault();
    
    if (!isAuthenticated || disabled || isLoading) {
      return;
    }

    try {
      let result;
      if (isRegistered) {
        result = await cancelRegistration();
      } else if (canRegister) {
        result = await register();
      } else {
        return; // não pode realizar ação
      }

      // mostrar feedback visual temporário
      if (result.success) {
        setActionFeedback('success');
      } else {
        setActionFeedback('error');
      }
    } catch (error) {
      console.error('Erro na ação de participação:', error);
      setActionFeedback('error');
    }
  }, [isAuthenticated, disabled, isLoading, isRegistered, canRegister, register, cancelRegistration]);

  // determinar classes CSS baseadas no estado
  const getButtonClasses = useCallback(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    // tamanhos
    const sizes = {
      small: 'px-3 py-1.5 text-xs rounded-md',
      medium: 'px-4 py-2 text-sm rounded-lg',
      large: 'px-6 py-3 text-base rounded-lg'
    };

    // variantes baseadas no estado atual
    let variantClasses = '';
    const currentVariant = variant === 'auto' ? getButtonVariant() : variant;
    
    switch (currentVariant) {
      case 'primary':
        if (isRegistered) {
          variantClasses = 'bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 text-white shadow-sm hover:shadow-md';
        } else {
          variantClasses = 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white shadow-sm hover:shadow-md';
        }
        break;
      case 'secondary':
        variantClasses = 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-sm hover:shadow-md';
        break;
      case 'outline':
        if (isRegistered) {
          variantClasses = 'border border-secondary-300 bg-white hover:bg-secondary-50 focus:ring-secondary-500 text-secondary-700 hover:border-secondary-400';
        } else {
          variantClasses = 'border border-primary-300 bg-white hover:bg-primary-50 focus:ring-primary-500 text-primary-700 hover:border-primary-400';
        }
        break;
      case 'disabled':
        variantClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed';
        break;
      default:
        variantClasses = 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white shadow-sm hover:shadow-md';
    }

    // classes de feedback
    let feedbackClasses = '';
    if (actionFeedback === 'success') {
      feedbackClasses = 'animate-pulse bg-green-600 hover:bg-green-700';
    } else if (actionFeedback === 'error') {
      feedbackClasses = 'animate-pulse bg-red-600 hover:bg-red-700';
    }

    // classes de estado desabilitado
    const isDisabled = disabled || !isAuthenticated || (!canRegister && !isRegistered) || registrationStatus === 'closed';
    if (isDisabled && !actionFeedback) {
      variantClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }

    return `${baseClasses} ${sizes[size]} ${feedbackClasses || variantClasses} ${className}`;
  }, [variant, size, isRegistered, canRegister, registrationStatus, disabled, isAuthenticated, actionFeedback, getButtonVariant, className]);

  // determinar texto do botão
  const getDisplayText = useCallback(() => {
    if (children) return children;
    
    if (actionFeedback === 'success') {
      return isRegistered ? 'Cancelado!' : 'Inscrito!';
    }
    
    if (actionFeedback === 'error') {
      return 'Erro';
    }
    
    if (isLoading) {
      return isRegistered ? 'Cancelando...' : 'Inscrevendo...';
    }

    return getButtonText();
  }, [children, actionFeedback, isLoading, isRegistered, getButtonText]);

  // determinar se deve mostrar ícone de loading
  const shouldShowLoading = isLoading && !actionFeedback;

  // determinar se deve mostrar ícone de sucesso
  const shouldShowSuccess = actionFeedback === 'success';

  // determinar se deve mostrar ícone de erro
  const shouldShowError = actionFeedback === 'error';

  // determinar se botão está desabilitado
  const isButtonDisabled = disabled || !isAuthenticated || isLoading || 
    (!canRegister && !isRegistered) || registrationStatus === 'closed';

  // ícones para diferentes estados
  const renderIcon = () => {
    if (shouldShowLoading) {
      return (
        <LoadingSpinner 
          size={size === 'small' ? 'sm' : size === 'large' ? 'md' : 'sm'} 
          color="white"
          className="mr-2"
        />
      );
    }

    if (shouldShowSuccess) {
      return (
        <svg 
          className="w-4 h-4 mr-2 animate-bounce" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7" 
          />
        </svg>
      );
    }

    if (shouldShowError) {
      return (
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      );
    }

    // ícones baseados no estado de participação
    if (isRegistered) {
      return (
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          />
        </svg>
      );
    }

    if (registrationStatus === 'full') {
      return (
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      );
    }

    if (canRegister) {
      return (
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
          />
        </svg>
      );
    }

    return null;
  };

  // determinar atributos de acessibilidade
  const getAriaAttributes = () => {
    const attributes = {
      'aria-label': `${getDisplayText()}${showParticipantsCount && shouldShowParticipantsCount() ? ` - ${getParticipantsText()}` : ''}`,
      'aria-disabled': isButtonDisabled,
      'role': 'button'
    };

    if (isLoading) {
      attributes['aria-busy'] = true;
    }

    if (error) {
      attributes['aria-describedby'] = `participation-error-${eventId}`;
    }

    return attributes;
  };

  // não renderizar se não há eventId
  if (!eventId) {
    return null;
  }

  // verificar se há erro crítico que impede renderização do botão
  const hasCriticalError = error && (
    error.includes('Erro ao carregar') || 
    error.includes('Dados insuficientes') ||
    error.includes('Erro inesperado')
  );

  // se há erro crítico, mostrar fallback compacto
  if (hasCriticalError) {
    return (
      <div className="participation-button-container">
        <div className="inline-flex items-center px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Erro ao carregar</span>
        </div>
        
        {/* Tooltip com detalhes do erro */}
        <div className="mt-1 text-xs text-gray-500 max-w-xs">
          {formatErrorForUser({ userMessage: error, canRetry: true }).message}
        </div>
      </div>
    );
  }

  return (
    <div className="participation-button-container">
      <button
        type="button"
        className={getButtonClasses()}
        disabled={isButtonDisabled}
        onClick={handleClick}
        {...getAriaAttributes()}
        {...props}
      >
        {renderIcon()}
        <span className="button-text">
          {getDisplayText()}
        </span>
      </button>

      {/* Mostrar contador de participantes se solicitado */}
      {showParticipantsCount && shouldShowParticipantsCount() && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          {getParticipantsText()}
        </div>
      )}

      {/* Mensagem de erro para acessibilidade */}
      {error && (
        <div 
          id={`participation-error-${eventId}`}
          className="sr-only"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ParticipationButton;