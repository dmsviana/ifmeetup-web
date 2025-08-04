import React, { useState, useEffect } from 'react';
import {
  getEventTypeLabel,
  getEventTypeIcon,
  formatEventTime
} from '../../schemas/eventSchema';
import { useAuth } from '../../auth/context/AuthContext';
import EventParticipationService from '../../services/eventParticipationService';
import SimpleParticipationButton from '../ui/SimpleParticipationButton';
import { 
  GraduationCap, 
  Wrench, 
  Mic, 
  Users, 
  Presentation, 
  BookOpen, 
  MoreHorizontal, 
  Calendar,
  MapPin,
  Clock,
  User,
  Info
} from 'lucide-react';

// mapeamento de ícones para tipos de evento (estilo mais próximo ao exemplo)
const iconMap = {
  'academic-cap': <GraduationCap className="w-12 h-12" />,
  'wrench-screwdriver': <Wrench className="w-12 h-12" />,
  'microphone': <Mic className="w-12 h-12" />,
  'users': <Users className="w-12 h-12" />,
  'presentation-chart-line': <Presentation className="w-12 h-12" />,
  'book-open': <BookOpen className="w-12 h-12" />,
  'ellipsis-horizontal': <MoreHorizontal className="w-12 h-12" />,
  'calendar': <Calendar className="w-12 h-12" />,
};

const EventCard = ({
  event,
  onViewDetails,
  onStatusChange,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const eventTypeIcon = getEventTypeIcon(event.eventType);
  const eventTypeLabel = getEventTypeLabel(event.eventType);
  const [participantCount, setParticipantCount] = useState(0);

  // formatação da data para o badge (estilo do exemplo)
  const formatDateBadge = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  };

  const fetchParticipantCount = async () => {
    try {
      const result = await EventParticipationService.getParticipantsCount(event.id);
      if (result.success) {
        setParticipantCount(result.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de participantes:', error);
    }
  };

  useEffect(() => {
    fetchParticipantCount();
  }, [event.id]);

  const handleParticipationChange = () => {
    fetchParticipantCount();
    if (onStatusChange) {
      onStatusChange();
    }
  };

  const handleDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(event.id);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-green-200 flex flex-col h-full ${className}`}>
      {/* Header com gradiente verde e ícone */}
      <div className="h-48 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center relative flex-shrink-0">
        {/* Ícone do tipo de evento */}
        <div className="text-white text-opacity-80">
          {iconMap[eventTypeIcon] || iconMap['calendar']}
        </div>

        {/* Badge da data */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm text-green-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm">
          {formatDateBadge(event.startDateTime)}
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Badge do tipo de evento */}
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit">
          {eventTypeLabel}
        </span>

        {/* Título do evento */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {event.title}
        </h3>

        {/* Descrição */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
          {event.description}
        </p>

        {/* Meta informações */}
        <div className="flex justify-between items-center mb-5 mt-auto">
          <div className="flex gap-4 flex-wrap">
            {/* Participantes - usando dados reais do hook */}
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-1.5 text-green-600" />
              <span>{participantCount}/{event.maxParticipants}</span>
            </div>

            {/* Horário */}
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1.5 text-green-600" />
              <span>{formatEventTime(event.startDateTime)}</span>
            </div>

            {/* Local */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1.5 text-green-600" />
              <span className="truncate">{event.room?.name || 'A definir'}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-auto">
          <div className="flex-1">
            <SimpleParticipationButton 
              eventId={event.id} 
              onParticipationChange={handleParticipationChange}
            />
          </div>

          <button
            onClick={handleDetailsClick}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg text-green-600 border border-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            <Info className="w-4 h-4 mr-2 inline" />
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;