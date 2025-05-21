
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { apiClient } from '@/api/core/apiClient';

/**
 * Hook to fetch tags for a specific chat channel
 */
export function useChatChannelTags(channelId: string | undefined) {
  return useQuery({
    queryKey: ["chatChannel", channelId, "tags"],
    queryFn: async () => {
      if (!channelId) return [];
      
      logger.info(`Fetching tags for chat channel ${channelId}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from("tag_assignments")
          .select(`
            *,
            tag:tags(*)
          `)
          .eq("target_id", channelId)
          .eq("target_type", EntityType.CHAT);
      });
      
      if (error) {
        logger.error(`Error fetching tags for chat channel ${channelId}:`, error);
        throw new Error(error.message || "Failed to fetch chat channel tags");
      }
      
      return (data || []) as TagAssignment[];
    },
    enabled: !!channelId
  });
}

/**
 * Hook to add a tag to a chat channel
 */
export function useAddChatChannelTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      channelId, 
      tagId 
    }: { 
      channelId: string; 
      tagId: string 
    }) => {
      logger.info(`Adding tag ${tagId} to chat channel ${channelId}`);
      
      // First check if this tag entity type association exists
      const { data: entityTypeAssoc, error: entityTypeError } = await apiClient.query(async (client) => {
        return client
          .from("tag_entity_types")
          .select("id")
          .eq("tag_id", tagId)
          .eq("entity_type", EntityType.CHAT)
          .maybeSingle();
      });
      
      // If no association exists, create it
      if (!entityTypeAssoc && !entityTypeError) {
        const { error: insertError } = await apiClient.query(async (client) => {
          return client
            .from("tag_entity_types")
            .insert({
              tag_id: tagId,
              entity_type: EntityType.CHAT
            });
        });
        
        if (insertError) {
          logger.error("Error creating tag entity type association:", insertError);
          throw new Error(insertError.message || "Failed to create tag entity type association");
        }
      }
      
      // Now create the tag assignment
      const { data, error } = await apiClient.query(async (client) => {
        return client
          .from("tag_assignments")
          .insert({
            tag_id: tagId,
            target_id: channelId,
            target_type: EntityType.CHAT
          })
          .select()
          .single();
      });
      
      if (error) {
        logger.error("Error assigning tag to chat channel:", error);
        throw new Error(error.message || "Failed to assign tag");
      }
      
      return data as TagAssignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chatChannel", variables.channelId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
      toast.success("Tag added to chat channel");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add tag");
    }
  });
}

/**
 * Hook to remove a tag from a chat channel
 */
export function useRemoveChatChannelTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      channelId 
    }: { 
      assignmentId: string; 
      channelId: string 
    }) => {
      logger.info(`Removing tag assignment ${assignmentId} from chat channel ${channelId}`);
      
      const { error } = await apiClient.query(async (client) => {
        return client
          .from("tag_assignments")
          .delete()
          .eq("id", assignmentId);
      });
      
      if (error) {
        logger.error("Error removing tag from chat channel:", error);
        throw new Error(error.message || "Failed to remove tag");
      }
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chatChannel", variables.channelId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
      toast.success("Tag removed from chat channel");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove tag");
    }
  });
}
