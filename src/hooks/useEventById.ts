
import { useQuery } from "@tanstack/react-query";
import { getById } from "@/api/events/eventsApi";
import { logger } from "@/utils/logger";

export function useEventById(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) {
        logger.warn("No event ID provided to useEventById");
        return null;
      }

      logger.info(`Fetching event with ID: ${eventId}`);
      
      try {
        const response = await getById(eventId);
        
        if (response.error) {
          logger.error(`Error fetching event ${eventId}:`, response.error);
          throw new Error(response.error.message || "Failed to fetch event");
        }
        
        if (!response.data) {
          logger.warn(`No event found for ID ${eventId}`);
          return null;
        }
        
        logger.info(`Successfully fetched event ${eventId}:`, response.data);
        return response.data;
      } catch (error) {
        logger.error(`Exception in event fetch query function:`, error);
        throw error; // Re-throw so React Query can handle it
      }
    },
    enabled: !!eventId, // Only run the query when we have an eventId
  });
}
