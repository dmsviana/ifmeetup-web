import React from 'react';
import { UserPlus, UserMinus, Loader2, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParticipationButton = ({
  eventId,
  eventData,
  participation,
  onParticipationChange,
  className = '',
  size = 'default',
  showIcon = true
}) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    // se não está autenticado, redirecionar para login
    if (!participation.canPerformActions && participation.getButtonText() === 'Fazer Login') {
      navigate('/login');
      return;
    }

    // se não pode realizar ações, não fazer nada
    if (!participation.canPerformActions || participation.getButtonVariant() === 'disabled') {
      return;
    }

    try {
      const result = await participation.toggleRegistration();
      
      // notificar componente pai sobre mudança
      if (onParticipationChange) {
        onParticipationChange(result);
      }
      
      // atualizar dados após ação
      participation.refresh();
      
    } catch (error) {
      console.error('Erro na ação de participação:', error);
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;

    const variant = participation.getButtonVariant();
    const isLoading = participation.isLoading;
    
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    switch (variant) {
      case 'primary':
        return <UserPlus className="w-4 h-4" />;
      case 'outline':
        return <UserMinus className="w-4 h-4" />;
      case 'secondary':
        return <Lock className="w-4 h-4" />;
      case 'disabled':
        if (participation.isEventFull && !participation.isRegistered) {
          return <Users className="w-4 h-4" />;
        }
        return <Lock className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2.5 text-sm';
    }
  };

  const getVariantClasses = () => {
    const variant = participation.getButtonVariant();
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm`;
      
      case 'outline':
        return `${baseClasses} bg-white text-red-600 border border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`;
      
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`;
      
      case 'disabled':
        return `${baseClasses} bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed`;
      
      case 'loading':
        return `${baseClasses} bg-green-600 text-white cursor-wait`;
      
      default:
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`;
    }
  };

  const isDisabled = participation.getButtonVariant() === 'disabled' || participation.isLoading;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${getVariantClasses()} ${getSizeClasses()} ${className}`}
      aria-label={participation.getButtonText()}
      title={participation.error || undefined}
    >
      {getIcon()}
      <span>{participation.getButtonText()}</span>
    </button>
  );
};

export default ParticipationButton;
