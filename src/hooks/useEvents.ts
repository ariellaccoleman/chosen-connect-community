
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/api";
import { logger } from "@/utils/logger";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      logger.info("Fetching events");
      const response = await eventsApi.getEvents();
      
      if (response.error) {
        logger.error("Error fetching events:", response.error);
        throw new Error(response.error.message || "Failed to fetch events");
      }
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.error("Invalid events data format:", response.data);
        return [];
      }
      
      logger.info(`Successfully fetched ${response.data.length} events:`, response.data);
      return response.data;
    },
    retry: 1, // Reduce retry attempts to avoid excessive fetching
    staleTime: 1000 * 60 * 5, // Cache events for 5 minutes
  });
}
