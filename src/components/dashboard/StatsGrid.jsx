import React from 'react';
import StatCard from './StatCard';

/**
 * Grid responsivo para exibir estatísticas do dashboard
 * Mostra 4 cards de estatísticas com estados de loading
 */
const StatsGrid = ({ stats, loading = false }) => {
  const statsConfig = [
    {
      key: 'activeEvents',
      label: 'Eventos Ativos',
      icon: 'calendar-check',
      color: 'green'
    },
    {
      key: 'totalParticipants', 
      label: 'Total de Participantes',
      icon: 'users',
      color: 'blue'
    },
    {
      key: 'availableRooms',
      label: 'Salas Disponíveis', 
      icon: 'door-open',
      color: 'purple'
    },
    {
      key: 'ongoingEvents',
      label: 'Eventos em Andamento',
      icon: 'clock',
      color: 'orange'
    }
  ];

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      role="region"
      aria-label="Estatísticas do sistema"
    >
      {statsConfig.map((config) => (
        <StatCard
          key={config.key}
          value={stats?.[config.key]}
          label={config.label}
          icon={config.icon}
          color={config.color}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default StatsGrid;