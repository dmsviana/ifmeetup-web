import { useState, useEffect, useCallback } from 'react';
import { EventService } from '../services';
import { useAuth } from '../auth/context/AuthContext';
import { useParticipationStatus } from './useParticipationStatus';
import {
    formatEventDate,
    formatEventTime,
    getEventTypeIcon,
    isFutureEvent
} from '../schemas/eventSchema';

// hook para gerenciar lista de eventos
export const useEvents = (options = {}) => {
    const {
        futureOnly = false,
        autoLoad = true,
        initialPage = 0,
        pageSize = 12,
        filters = {}
    } = options;

    const { isAuthenticated } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: initialPage,
        size: pageSize,
        totalPages: 0,
        totalElements: 0,
        hasMore: true,
        first: true,
        last: false
    });

    // extrair IDs dos eventos para verificação de participação
    const eventIds = events.map(event => event.id);

    // usar hook de participação para verificar status em lote
    const {
        statusMap,
        isLoading: participationLoading,
        getStatus,
        isRegistered,
        canRegister,
        getParticipantsCount
    } = useParticipationStatus(eventIds, {
        autoLoad: isAuthenticated && eventIds.length > 0,
        enableCache: true,
        debounceDelay: 300
    });

    // função para transformar eventos para exibição com dados de participação
    const transformEventForDisplay = useCallback((event, includeParticipation = false) => {
        const baseEvent = {
            ...event,
            formattedDate: formatEventDate(event.startDateTime),
            formattedTime: formatEventTime(event.startDateTime),
            categoryIcon: getEventTypeIcon(event.eventType)
        };

        // se não deve incluir participação ou usuário não autenticado, usar lógica básica
        if (!includeParticipation || !isAuthenticated) {
            return {
                ...baseEvent,
                isSubscribed: false,
                canSubscribe: event.status === 'APPROVED' &&
                    isFutureEvent(event.startDateTime) &&
                    (event.currentParticipants || 0) < event.maxParticipants,
                currentParticipants: event.currentParticipants || 0
            };
        }

        // obter dados de participação do hook
        const participationStatus = getStatus(event.id);
        const userIsRegistered = isRegistered(event.id);
        const userCanRegister = canRegister(event.id);
        const realParticipantsCount = getParticipantsCount(event.id);

        return {
            ...baseEvent,
            isSubscribed: userIsRegistered,
            canSubscribe: userCanRegister && 
                event.status === 'APPROVED' &&
                isFutureEvent(event.startDateTime),
            currentParticipants: realParticipantsCount > 0 ? realParticipantsCount : (event.currentParticipants || 0),
            participationStatus
        };
    }, [isAuthenticated, getStatus, isRegistered, canRegister, getParticipantsCount]);

    // função para carregar eventos
    const loadEvents = useCallback(async (page = 0, append = false) => {
        try {
            setLoading(true);
            setError(null);

            let result;

            if (futureOnly) {
                result = await EventService.getFutureEvents({
                    page,
                    size: pageSize,
                    ...filters
                });
            } else {
                result = await EventService.searchEvents({
                    page,
                    size: pageSize,
                    futureOnly,
                    ...filters
                });
            }

            if (result.success) {
                // primeiro transformar eventos sem dados de participação
                const baseTransformedEvents = result.data.content.map(event => 
                    transformEventForDisplay(event, false)
                );

                if (append) {
                    setEvents(prev => [...prev, ...baseTransformedEvents]);
                } else {
                    setEvents(baseTransformedEvents);
                }

                setPagination({
                    page: result.data.number,
                    size: result.data.size,
                    totalPages: result.data.totalPages,
                    totalElements: result.data.totalElements,
                    hasMore: !result.data.last,
                    first: result.data.first,
                    last: result.data.last
                });
            } else {
                setError(result.error?.message || 'Erro ao carregar eventos');
            }
        } catch (err) {
            console.error('Erro ao carregar eventos:', err);
            setError(err.message || 'Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    }, [futureOnly, pageSize, filters, transformEventForDisplay]);

    // função para carregar próxima página
    const loadMore = useCallback(() => {
        if (!loading && pagination.hasMore) {
            loadEvents(pagination.page + 1, true);
        }
    }, [loading, pagination.hasMore, pagination.page, loadEvents]);

    // função para refresh
    const refresh = useCallback(() => {
        loadEvents(0, false);
    }, [loadEvents]);

    // carregar dados na inicialização
    useEffect(() => {
        if (autoLoad) {
            loadEvents(initialPage, false);
        }
    }, [autoLoad, initialPage, loadEvents]);

    // recarregar quando filtros mudarem
    useEffect(() => {
        if (autoLoad) {
            loadEvents(0, false);
        }
    }, [filters, futureOnly, loadEvents, autoLoad]);

    // atualizar eventos com dados de participação quando disponíveis
    useEffect(() => {
        if (isAuthenticated && events.length > 0 && statusMap.size > 0) {
            setEvents(prevEvents => 
                prevEvents.map(event => 
                    transformEventForDisplay(event, true)
                )
            );
        }
    }, [statusMap, isAuthenticated, transformEventForDisplay, events.length]);

    // combinar loading states
    const isLoadingData = loading || (isAuthenticated && participationLoading && events.length > 0);

    return {
        events,
        loading: isLoadingData,
        error,
        pagination,
        loadMore,
        refresh,
        hasMore: pagination.hasMore,
        isEmpty: events.length === 0 && !loading,
        // dados adicionais de participação
        participationLoading,
        statusMap
    };
};

// hook específico para eventos futuros (homepage)
export const useFutureEvents = (options = {}) => {
    return useEvents({
        ...options,
        futureOnly: true
    });
};

// hook para um evento específico
export const useEvent = (eventId, options = {}) => {
    const { autoLoad = true } = options;
    const { isAuthenticated } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // usar hook de participação para este evento específico
    const {
        getStatus,
        isRegistered,
        canRegister,
        getParticipantsCount,
        isLoading: participationLoading
    } = useParticipationStatus(eventId ? [eventId] : [], {
        autoLoad: isAuthenticated && !!eventId,
        enableCache: true
    });

    // função para transformar evento individual com dados de participação
    const transformSingleEventForDisplay = useCallback((eventData) => {
        const baseEvent = {
            ...eventData,
            formattedDate: formatEventDate(eventData.startDateTime),
            formattedTime: formatEventTime(eventData.startDateTime),
            categoryIcon: getEventTypeIcon(eventData.eventType)
        };

        // se usuário não autenticado, usar lógica básica
        if (!isAuthenticated) {
            return {
                ...baseEvent,
                isSubscribed: false,
                canSubscribe: eventData.status === 'APPROVED' &&
                    isFutureEvent(eventData.startDateTime) &&
                    (eventData.currentParticipants || 0) < eventData.maxParticipants,
                currentParticipants: eventData.currentParticipants || 0
            };
        }

        // obter dados de participação do hook
        const participationStatus = getStatus(eventId);
        const userIsRegistered = isRegistered(eventId);
        const userCanRegister = canRegister(eventId);
        const realParticipantsCount = getParticipantsCount(eventId);

        return {
            ...baseEvent,
            isSubscribed: userIsRegistered,
            canSubscribe: userCanRegister && 
                eventData.status === 'APPROVED' &&
                isFutureEvent(eventData.startDateTime),
            currentParticipants: realParticipantsCount > 0 ? realParticipantsCount : (eventData.currentParticipants || 0),
            participationStatus
        };
    }, [eventId, isAuthenticated, getStatus, isRegistered, canRegister, getParticipantsCount]);

    const loadEvent = useCallback(async () => {
        if (!eventId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await EventService.getEventById(eventId);

            if (result.success) {
                const transformedEvent = transformSingleEventForDisplay(result.data);
                setEvent(transformedEvent);
            } else {
                setError(result.error?.message || 'Erro ao carregar evento');
            }
        } catch (err) {
            console.error('Erro ao carregar evento:', err);
            setError(err.message || 'Erro ao carregar evento');
        } finally {
            setLoading(false);
        }
    }, [eventId, transformSingleEventForDisplay]);

    const refresh = useCallback(() => {
        loadEvent();
    }, [loadEvent]);

    // carregar evento na inicialização
    useEffect(() => {
        if (autoLoad && eventId) {
            loadEvent();
        }
    }, [autoLoad, eventId, loadEvent]);

    // atualizar evento com dados de participação quando disponíveis
    useEffect(() => {
        if (isAuthenticated && event && eventId) {
            const updatedEvent = transformSingleEventForDisplay(event);
            // só atualizar se houve mudança real nos dados de participação
            if (JSON.stringify(updatedEvent) !== JSON.stringify(event)) {
                setEvent(updatedEvent);
            }
        }
    }, [isAuthenticated, event, eventId, transformSingleEventForDisplay]);

    // combinar loading states
    const isLoadingData = loading || (isAuthenticated && participationLoading && !!event);

    return {
        event,
        loading: isLoadingData,
        error,
        refresh,
        // dados adicionais de participação
        participationLoading
    };
};

// hook para inscrição em eventos (deprecated - usar useEventParticipation)
export const useEventSubscription = () => {
    const [subscribing, setSubscribing] = useState(false);
    const [error, setError] = useState(null);

    const subscribe = useCallback(async (eventId) => {
        try {
            setSubscribing(true);
            setError(null);

            // usar o service real de participação
            const EventParticipationService = (await import('../services/eventParticipationService')).default;
            const result = await EventParticipationService.registerForEvent(eventId);

            if (result.success) {
                return { success: true, message: 'Inscrição realizada com sucesso!' };
            } else {
                const errorMessage = result.error?.message || 'Erro ao se inscrever no evento';
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }
        } catch (err) {
            console.error('Erro ao se inscrever no evento:', err);
            const errorMessage = err.message || 'Erro ao se inscrever no evento';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setSubscribing(false);
        }
    }, []);

    const unsubscribe = useCallback(async (eventId) => {
        try {
            setSubscribing(true);
            setError(null);

            // usar o service real de participação
            const EventParticipationService = (await import('../services/eventParticipationService')).default;
            const result = await EventParticipationService.cancelRegistration(eventId);

            if (result.success) {
                return { success: true, message: 'Inscrição cancelada com sucesso!' };
            } else {
                const errorMessage = result.error?.message || 'Erro ao cancelar inscrição';
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }
        } catch (err) {
            console.error('Erro ao cancelar inscrição:', err);
            const errorMessage = err.message || 'Erro ao cancelar inscrição';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setSubscribing(false);
        }
    }, []);

    return {
        subscribing,
        error,
        subscribe,
        unsubscribe
    };
};

export default useEvents;