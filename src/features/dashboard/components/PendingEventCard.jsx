import React from 'react';
import {
  getEventTypeLabel,
  getEventTypeIcon,
  formatEventTime
} from '../../../shared/constants/eventSchema';
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
  Check,
  X,
  Info,
  Loader2
} from 'lucide-react';

// mapeamento de ícones para tipos de evento
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

const PendingEventCard = ({
  event,
  onApprove,
  onReject,
  onViewDetails,
  isProcessing = false,
  participationCount = null,
  className = ''
}) => {
  const eventTypeIcon = getEventTypeIcon(event.eventType);
  const eventTypeLabel = getEventTypeLabel(event.eventType);

  // formatação da data para o badge
  const formatDateBadge = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  };

  const handleApproveClick = () => {
    if (onApprove && !isProcessing) {
      onApprove(event.id);
    }
  };

  const handleRejectClick = () => {
    if (onReject && !isProcessing) {
      onReject(event.id);
    }
  };

  const handleDetailsClick = () => {
    if (onViewDetails && event?.id) {
      onViewDetails(event.id);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 border-l-yellow-400 border border-yellow-200 bg-yellow-50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-yellow-300 flex flex-col h-full ${className}`}>
      {/* Header com gradiente amarelo para eventos pendentes */}
      <div className="h-48 bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center relative flex-shrink-0">
        {/* Ícone do tipo de evento */}
        <div className="text-white text-opacity-80">
          {iconMap[eventTypeIcon] || iconMap['calendar']}
        </div>

        {/* Badge da data */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm text-yellow-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm">
          {formatDateBadge(event.startDateTime)}
        </div>

        {/* Badge de status pendente */}
        <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
          Pendente
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Badge do tipo de evento */}
        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit">
          {eventTypeLabel}
        </span>

        {/* Título do evento */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {event.title}
        </h3>

        {/* Organizador */}
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Organizador:</span> {event.organizer?.name || 'Não informado'}
        </p>

        {/* Descrição */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
          {event.description}
        </p>

        {/* Meta informações */}
        <div className="flex justify-between items-center mb-5 mt-auto">
          <div className="flex gap-4 flex-wrap">
            {/* Participantes */}
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-1.5 text-yellow-600" />
              <span>
                {participationCount !== null ? participationCount : (event.currentParticipants || 0)}/{event.maxParticipants}
                {participationCount !== null && (
                  <span className="ml-1 text-xs text-green-600 font-medium">(real)</span>
                )}
              </span>
            </div>

            {/* Horário */}
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1.5 text-yellow-600" />
              <span>{formatEventTime(event.startDateTime)}</span>
            </div>

            {/* Local */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1.5 text-yellow-600" />
              <span className="truncate">{event.room?.name || 'A definir'}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação para aprovação */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleApproveClick}
            disabled={isProcessing}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Aprovar'}
          </button>

          <button
            onClick={handleRejectClick}
            disabled={isProcessing}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Rejeitar'}
          </button>

          <button
            onClick={handleDetailsClick}
            disabled={isProcessing}
            className={`px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300'
                : 'text-yellow-600 border border-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingEventCard;