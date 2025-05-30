
import { useQuery } from "@tanstack/react-query";
import { TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { apiClient } from "@/api/core/apiClient";

/**
 * Hook to fetch tags for a specific event
 */
export function useEventTags(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId, "tags"],
    queryFn: async () => {
      if (!eventId) return [];
      
      logger.info(`Fetching tags for event ${eventId}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from("tag_assignments")
          .select(`
            *,
            tag:tags(*)
          `)
          .eq("target_id", eventId)
          .eq("target_type", EntityType.EVENT);
      });
      
      if (error) {
        logger.error(`Error fetching tags for event ${eventId}:`, error);
        throw new Error(error.message || "Failed to fetch event tags");
      }
      
      return (data || []) as TagAssignment[];
    },
    enabled: !!eventId,
    staleTime: 30000 // Cache for 30 seconds via React Query
  });
}
