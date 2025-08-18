import React from 'react';
import { 
  CalendarDaysIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { formatNumber } from '../../../shared/utils/formatters';

/**
 * Mapeamento de ícones para os tipos de estatísticas
 */
const iconMap = {
  'calendar-check': CalendarDaysIcon,
  'users': UsersIcon,
  'door-open': BuildingOfficeIcon,
  'clock': ClockIcon
};

/**
 * Mapeamento de cores para os diferentes tipos de estatísticas
 */
const colorMap = {
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200'
  },
  blue: {
    bg: 'bg-blue-50', 
    icon: 'text-blue-600',
    border: 'border-blue-200'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600', 
    border: 'border-purple-200'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200'
  }
};

/**
 * Componente de skeleton para estado de loading
 */
const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

/**
 * Card individual para exibir uma estatística
 * Inclui valor, label, ícone e estados de loading/erro
 */
const StatCard = ({ 
  value, 
  label, 
  icon = 'calendar-check', 
  color = 'green', 
  loading = false,
  error = false 
}) => {
  // mostra skeleton durante loading
  if (loading) {
    return <StatCardSkeleton />;
  }

  const IconComponent = iconMap[icon] || CalendarDaysIcon;
  const colors = colorMap[color] || colorMap.green;
  
  // valor formatado ou fallback para erro
  const displayValue = error ? '--' : formatNumber(value || 0);
  
  return (
    <div 
      className={`bg-white rounded-lg border ${colors.border} p-6 hover:shadow-md transition-shadow duration-200`}
      role="group"
      aria-labelledby={`stat-${icon}-label`}
      aria-describedby={`stat-${icon}-value`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <p 
            id={`stat-${icon}-label`}
            className="text-sm font-medium text-gray-600"
          >
            {label}
          </p>
          <p 
            id={`stat-${icon}-value`}
            className="text-3xl font-bold text-gray-900"
            aria-live="polite"
          >
            {displayValue}
          </p>
          {error && (
            <p className="text-xs text-red-500" role="alert">
              Erro ao carregar
            </p>
          )}
        </div>
        
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <IconComponent 
            className={`h-6 w-6 ${colors.icon}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

export default StatCard;