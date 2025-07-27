const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    AVAILABLE: {
      label: 'Disponível',
      classes: 'bg-success-50 text-success-600 border-success-200'
    },
    UNAVAILABLE: {
      label: 'Indisponível',
      classes: 'bg-warning-50 text-warning-600 border-warning-200'
    },
    UNDER_MAINTENANCE: {
      label: 'Em Manutenção',
      classes: 'bg-secondary-50 text-secondary-600 border-secondary-200'
    },
    DISABLED: {
      label: 'Desabilitada',
      classes: 'bg-danger-50 text-danger-600 border-danger-200'
    }
  };

  const config = statusConfig[status] || {
    label: status || 'Desconhecido',
    classes: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge; 