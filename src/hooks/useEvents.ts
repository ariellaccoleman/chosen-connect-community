
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
      
      logger.info(`Successfully fetched ${response.data?.length || 0} events`);
      return response.data || [];
    },
  });
}
