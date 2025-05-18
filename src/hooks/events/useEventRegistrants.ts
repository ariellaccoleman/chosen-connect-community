
import { useQuery } from "@tanstack/react-query";
import { eventRegistrationApi } from "@/api/events/registrationApi";
import { EventRegistration } from "@/types/event";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch and manage the list of users registered for an event
 * This should only be used by event hosts
 */
export const useEventRegistrants = (eventId: string | undefined, isHost: boolean = false) => {
  return useQuery({
    queryKey: ['event-registrants', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      logger.info(`Fetching registrants for event ${eventId}`);
      const response = await eventRegistrationApi.getEventRegistrants(eventId);
      
      if (response.error) {
        logger.error("Failed to fetch event registrants:", response.error);
        throw response.error;
      }
      
      return response.data || [];
    },
    // Only fetch if we have an event ID and the current user is the host
    enabled: !!eventId && isHost
  });
};
