import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const { id, message, type, duration } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-3 sm:p-4 mb-2 sm:mb-4 text-sm sm:text-base rounded-lg shadow-lg transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} text-green-800 bg-green-50 border border-green-200`;
      case 'error':
        return `${baseStyles} text-red-800 bg-red-50 border border-red-200`;
      case 'warning':
        return `${baseStyles} text-yellow-800 bg-yellow-50 border border-yellow-200`;
      case 'info':
      default:
        return `${baseStyles} text-blue-800 bg-blue-50 border border-blue-200`;
    }
  };

  const getIcon = () => {
    const iconProps = { className: "flex-shrink-0 w-4 h-4 mr-3" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="sr-only">{type}</span>
      <div className="flex-1">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-2 sm:p-1.5 hover:bg-gray-100 active:bg-gray-200 inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center touch-manipulation"
        onClick={() => onRemove(id)}
        aria-label="Fechar notificação"
      >
        <span className="sr-only">Fechar</span>
        <X className="w-4 h-4 sm:w-3 sm:h-3" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 space-y-2">
      {/* Mobile: full width with margins, Desktop: fixed width on right */}
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
export default Toast;