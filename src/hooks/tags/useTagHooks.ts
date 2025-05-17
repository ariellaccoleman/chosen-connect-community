
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Import API functions
import { 
  getEntityTags, 
  getEntitiesWithTag,
  getSelectionTags,
  getFilterTags
} from '@/api/tags';

import {
  assignTag as assignTagUtil,
  removeTagAssignment as removeTagAssignmentUtil,
  invalidateTagCache,
  fetchTags,
  fetchFilterTags,
  createTag as createTagUtil,
  findOrCreateTag as findOrCreateTagUtil
} from '@/utils/tags';

/**
 * Core tag query hooks
 */

/**
 * Hook for querying tags assigned to a specific entity
 */
export const useEntityTags = (entityId: string | undefined, entityType: string | undefined) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: async () => {
      if (!entityId || !entityType) {
        return { data: [] };
      }
      logger.info(`Fetching tags for ${entityType} ${entityId}`);
      return getEntityTags(entityId, entityType);
    },
    enabled: !!entityId && !!entityType,
  });
};

/**
 * Hook for filtering entities by tag
 */
export const useFilterByTag = (tagId: string | null, entityType?: string) => {
  return useQuery({
    queryKey: ["filter-by-tag", tagId, entityType],
    queryFn: () => getEntitiesWithTag(tagId as string, entityType),
    enabled: !!tagId,
  });
};

/**
 * Hook for retrieving tags for selection UI
 * Gets both entity-specific and general tags
 */
export const useSelectionTags = (entityType?: string | EntityType) => {
  return useQuery({
    queryKey: ["selection-tags", entityType],
    queryFn: () => {
      return getSelectionTags(entityType ? { targetType: entityType } : undefined);
    },
  });
};

/**
 * Hook for retrieving tags used for filtering (only assigned tags)
 */
export const useFilterTags = (tagId: string | null, entityType?: string | EntityType) => {
  return useQuery({
    queryKey: ["filter-tags", tagId, entityType],
    queryFn: () => {
      return getFilterTags(entityType ? { targetType: entityType } : undefined);
    },
    enabled: !!entityType,
  });
};

/**
 * Tag assignment mutation hooks
 */

/**
 * Hook for tag assignment mutations
 * Provides functions for assigning tags to entities and removing tag assignments
 */
export const useTagAssignmentMutations = () => {
  const queryClient = useQueryClient();

  // Assign tag mutation
  const assignTagMutation = useMutation({
    mutationFn: async ({
      tagId,
      entityId,
      entityType
    }: {
      tagId: string;
      entityId: string;
      entityType: EntityType | string; 
    }) => {
      logger.info("Executing assignTag mutation:", { tagId, entityId, entityType });
      const response = await assignTagUtil(tagId, entityId, entityType);
      
      if (response.error || !response.data) {
        throw new Error(response.error?.message || "Failed to assign tag");
      }
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Tag added successfully`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["entity-tags", variables.entityId, variables.entityType] 
      });
      
      // Invalidate specific entity queries if this is an event
      if (variables.entityType === EntityType.EVENT) {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["event", variables.entityId] });
      }
      
      // Also invalidate tag queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      
      // Clear the tag cache for this entity type
      invalidateTagCache(variables.entityType);
    },
    onError: (error) => {
      logger.error("Error in assignTagMutation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add tag");
    }
  });

  // Remove tag assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await removeTagAssignmentUtil(assignmentId);
      
      if (response.error || !response.data) {
        throw new Error(response.error?.message || "Failed to remove tag");
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tag removed successfully");
      
      // Invalidate all potentially affected queries
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      
      // Clear all entity type caches to be safe
      Object.values(EntityType).forEach(type => {
        invalidateTagCache(type);
      });
    },
    onError: (error) => {
      logger.error("Error in removeAssignmentMutation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove tag");
    }
  });

  return {
    assignTag: assignTagMutation.mutateAsync,
    removeTagAssignment: removeAssignmentMutation.mutateAsync,
    isAssigning: assignTagMutation.isPending,
    isRemoving: removeAssignmentMutation.isPending
  };
};

/**
 * Tag CRUD hooks
 */

/**
 * Hook for tag creation and management
 */
export const useTagCrudMutations = () => {
  const queryClient = useQueryClient();
  
  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: Partial<Tag>) => {
      const result = await createTagUtil(data);
      if (!result) {
        throw new Error("Failed to create tag");
      }
      return result;
    },
    onSuccess: async () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      await invalidateTagCache();
    },
    onError: (error) => {
      logger.error("Error creating tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create tag");
    }
  });

  // Find or create tag mutation
  const findOrCreateTagMutation = useMutation({
    mutationFn: async (data: Partial<Tag>) => {
      const result = await findOrCreateTagUtil(data);
      if (!result) {
        throw new Error("Failed to find or create tag");
      }
      return result;
    },
    onSuccess: async () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      await invalidateTagCache();
    },
    onError: (error) => {
      logger.error("Error finding or creating tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to find or create tag");
    }
  });

  return {
    createTag: createTagMutation.mutateAsync,
    findOrCreateTag: findOrCreateTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    isFindingOrCreating: findOrCreateTagMutation.isPending
  };
};

// Legacy compatibility hooks
export const useTags = useSelectionTags;
