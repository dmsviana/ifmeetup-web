import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import EventParticipationService from '../../services/eventParticipationService';
import { useToastContext } from '../../contexts/ToastContext';

const SimpleParticipationButton = ({ eventId, onParticipationChange }) => {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); // apenas para ações do usuário
  const [isCheckingStatus, setIsCheckingStatus] = useState(false); // apenas para verificação inicial

  const checkRegistrationStatus = useCallback(async () => {
    if (!user || !eventId) {
      setIsCheckingStatus(false);
      return;
    }

    try {
      setIsCheckingStatus(true);
      const result = await EventParticipationService.checkRegistrationStatus(eventId, user.id);
      if (result.success) {
        setIsRegistered(result.data.isRegistered);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status de inscrição:', error);
      setIsRegistered(false);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [user, eventId]);

  useEffect(() => {
    checkRegistrationStatus();
  }, [checkRegistrationStatus]);

  const handleParticipation = async () => {
    if (!user) {
      error('Você precisa estar logado para se inscrever');
      return;
    }

    if (isActionLoading) {
      return; // Previne múltiplos cliques
    }

    try {
      setIsActionLoading(true);
      
      if (isRegistered) {
        const result = await EventParticipationService.cancelRegistration(eventId);
        if (result.success) {
          setIsRegistered(false);
          success('Inscrição cancelada com sucesso!');
        } else {
          throw new Error(result.error?.message || 'Erro ao cancelar inscrição');
        }
      } else {
        const result = await EventParticipationService.registerForEvent(eventId);
        if (result.success) {
          setIsRegistered(true);
          success('Inscrição realizada com sucesso!');
        } else {
          throw new Error(result.error?.message || 'Erro ao se inscrever');
        }
      }

      if (onParticipationChange) {
        onParticipationChange();
      }
    } catch (err) {
      console.error('Erro ao processar inscrição:', err);
      const errorMessage = err.message || 'Erro ao processar inscrição';
      error(errorMessage);
      // Recarrega o status em caso de erro para garantir consistência
      await checkRegistrationStatus();
    } finally {
      setIsActionLoading(false);
    }
  };

  // Se ainda não temos usuário ou eventId, não renderiza nada
  if (!user || !eventId) {
    return null;
  }

  // Se está verificando o status inicial, mostra loading discreto
  if (isCheckingStatus) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando...
      </Button>
    );
  }

  return (
    <Button
      onClick={handleParticipation}
      disabled={isActionLoading}
      className={`w-full ${
        isRegistered 
          ? 'bg-red-600 hover:bg-red-700' 
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isActionLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isRegistered ? 'Cancelando...' : 'Inscrevendo...'}
        </>
      ) : (
        <>
          {isRegistered ? (
            <>
              <UserMinus className="mr-2 h-4 w-4" />
              Cancelar Inscrição
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Inscrever-se
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default SimpleParticipationButton;