
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { apiClient } from "@/api/core/apiClient";
import { useTagAssignmentMutations } from "@/hooks/tags";

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
    enabled: !!eventId
  });
}

/**
 * Hook to add a tag to an event
 * @deprecated Use the generic useTagAssignmentMutations() hook instead
 */
export function useAddEventTag() {
  const queryClient = useQueryClient();
  const { assignTag } = useTagAssignmentMutations();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      tagId 
    }: { 
      eventId: string; 
      tagId: string 
    }) => {
      logger.info(`Adding tag ${tagId} to event ${eventId}`);
      await assignTag({
        tagId,
        entityId: eventId,
        entityType: EntityType.EVENT
      });
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event", variables.eventId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Tag added to event");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add tag");
    }
  });
}

/**
 * Hook to remove a tag from an event
 * @deprecated Use the generic useTagAssignmentMutations() hook instead
 */
export function useRemoveEventTag() {
  const queryClient = useQueryClient();
  const { removeTagAssignment } = useTagAssignmentMutations();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      eventId 
    }: { 
      assignmentId: string; 
      eventId: string 
    }) => {
      logger.info(`Removing tag assignment ${assignmentId} from event ${eventId}`);
      await removeTagAssignment(assignmentId);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event", variables.eventId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Tag removed from event");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove tag");
    }
  });
}
