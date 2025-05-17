
import { EventWithDetails, CreateEventInput } from "@/types/event";
import { eventsApi } from "@/api/events/eventsApi";
import { createQueryHooks } from "../core/factory/queryHookFactory";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

/**
 * Generate standard event hooks using the query hook factory
 */
export const eventHooks = createQueryHooks<
  EventWithDetails,
  string,
  CreateEventInput,
  Partial<CreateEventInput>
>(
  {
    name: 'event',
    pluralName: 'events',
    displayName: 'Event',
    pluralDisplayName: 'Events'
  },
  eventsApi
);

// Custom useEvents hook that returns the data directly for compatibility
export const useEvents = () => {
  const result = eventHooks.useList();
  
  // Transform the response to ensure data is an array
  return {
    ...result,
    data: result.data?.data || [],
    isLoading: result.isLoading,
    error: result.error
  };
};

// Custom useEventById hook that returns the data directly for compatibility
export const useEventById = (eventId: string | undefined) => {
  const result = useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      logger.info(`Fetching event with ID: ${eventId}`);
      const response = await eventsApi.getById(eventId);
      
      if (response.error) {
        logger.error(`Error fetching event ${eventId}:`, response.error);
        throw response.error;
      }
      
      return response.data;
    },
    enabled: !!eventId
  });
  
  return result;
};

// Re-export all hooks as a group
export const useEventHooks = eventHooks;
