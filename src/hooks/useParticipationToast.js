import { useMemo } from 'react';
import { useToastContext } from '../contexts/ToastContext';
import ParticipationToastService from '../services/participationToastService';

// hook para usar o serviço de toast de participação
export const useParticipationToast = () => {
  const toastContext = useToastContext();
  
  // criar instância do serviço usando useMemo para evitar recriações
  const participationToast = useMemo(() => {
    return new ParticipationToastService(toastContext);
  }, [toastContext]);
  
  return participationToast;
};

export default useParticipationToast;