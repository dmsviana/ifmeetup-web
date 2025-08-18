import { useState } from 'react';
import { Edit3, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { useAuth } from '../../auth/context/AuthContext';
import usePermissions from '../../auth/hooks/usePermissions';
import { useToast } from '../../../shared/hooks';

const EventActionButtons = ({ 
  event, 
  onEdit, 
  onDelete, 
  className = '',
  size = 'sm',
  disabled = false,
  isLoading = false
}) => {
  const { user } = useAuth();
  const { canEditEvents, canDeleteEvents } = usePermissions();
  const { error: showError } = useToast();
  
  // estados locais para controle de loading individual
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // verificar se dados necessários estão disponíveis
  if (!event || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          <span className="hidden sm:inline">Carregando ações...</span>
        </div>
      </div>
    );
  }

  // verificar se usuário é organizador do evento
  const isOrganizer = Boolean(event.organizer && event.organizer.id && user.id && event.organizer.id === user.id);

  // verificar permissões para editar com tratamento de erro
  let canEdit = false;
  let canDelete = false;
  
  try {
    // verificar permissões globais primeiro (com tratamento de erro)
    let hasEditPermission = false;
    let hasDeletePermission = false;
    
    try {
      // para frontend, só mostrar botões para admins ou organizadores
      // permissões específicas como EVENT_EDIT/EVENT_DELETE não são suficientes para exibir botões
      const isAdmin = user.permissions?.includes('ADMIN_ACCESS') || user.roles?.includes('ADMIN');
      hasEditPermission = isAdmin;
      hasDeletePermission = isAdmin;
    } catch (permError) {
      console.warn('Erro ao verificar permissões globais:', permError);
      hasEditPermission = false;
      hasDeletePermission = false;
    }
    
    // combinar organizador com permissões de admin apenas
    canEdit = isOrganizer || hasEditPermission;
    canDelete = isOrganizer || hasDeletePermission;
    
    // log para debug em desenvolvimento apenas se necessário
    if (process.env.NODE_ENV === 'development' && window.DEBUG_PERMISSIONS) {
      const isAdmin = user.permissions?.includes('ADMIN_ACCESS') || user.roles?.includes('ADMIN');
      console.log('🔍 EventActionButtons - Debug de permissões (restritiva):', {
        eventId: event.id,
        eventTitle: event.title,
        organizer: { id: event.organizer?.id, name: event.organizer?.name },
        user: { id: user.id, name: user.name, email: user.email },
        checks: { 
          isOrganizer, 
          isAdmin,
          canEdit, 
          canDelete 
        },
        permissions: user.permissions || [],
        roles: user.roles || [],
        note: 'Botões só aparecem para organizadores ou admins'
      });
      
      if (!canEdit && !canDelete) {
        console.log('❌ Usuário não é organizador nem admin - botões ocultos');
      } else {
        console.log('✅ Usuário é', 
          isOrganizer ? 'organizador' : '',
          isOrganizer && isAdmin ? ' e ' : '',
          isAdmin ? 'admin' : '',
          '- botões visíveis'
        );
      }
    }
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    setPermissionError('Erro ao verificar permissões');
    showError('🚫 Erro ao verificar suas permissões. Recarregue a página ou entre em contato com o suporte se o problema persistir.');
  }

  // se não tem nenhuma permissão, não renderizar nada
  if (!canEdit && !canDelete) {
    // mostrar erro de permissão se houver
    if (permissionError) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="flex items-center text-danger-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="sr-only">{permissionError}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  // handlers com tratamento de erro e loading
  const handleEdit = async () => {
    if (disabled || isLoading || isEditLoading || !onEdit) return;

    try {
      setIsEditLoading(true);
      await onEdit();
    } catch (error) {
      console.error('Erro ao abrir modal de edição:', error);
      showError('❌ Erro ao abrir editor do evento. Verifique sua conexão e tente novamente.');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (disabled || isLoading || isDeleteLoading || !onDelete) return;

    try {
      setIsDeleteLoading(true);
      await onDelete();
    } catch (error) {
      console.error('Erro ao abrir modal de exclusão:', error);
      showError('❌ Erro ao abrir confirmação de exclusão. Verifique sua conexão e tente novamente.');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // determinar se botões devem estar desabilitados
  const buttonsDisabled = disabled || isLoading || isEditLoading || isDeleteLoading;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {canEdit && (
        <Button
          variant="outline"
          size={size}
          onClick={handleEdit}
          disabled={buttonsDisabled}
          loading={isEditLoading}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            buttonsDisabled 
              ? 'Aguarde a operação atual terminar'
              : isOrganizer 
                ? 'Editar evento'
                : 'Editar evento'
          }
        >
          {isEditLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Edit3 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isEditLoading ? 'Editando...' : 'Editar'}</span>
        </Button>
      )}
      
      {canDelete && (
        <Button
          variant="outline"
          size={size}
          onClick={handleDelete}
          disabled={buttonsDisabled}
          loading={isDeleteLoading}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            buttonsDisabled 
              ? 'Aguarde a operação atual terminar'
              : isOrganizer 
                ? 'Excluir evento'
                : 'Excluir evento'
          }
        >
          {isDeleteLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isDeleteLoading ? 'Excluindo...' : 'Excluir'}</span>
        </Button>
      )}

      {/* Indicador de loading geral se necessário */}
      {isLoading && (
        <div className="flex items-center text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          <span className="sr-only">Processando...</span>
        </div>
      )}
    </div>
  );
};

export default EventActionButtons;