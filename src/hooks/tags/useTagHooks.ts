
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/core/apiClient";
import { EntityType } from "@/types/entityTypes";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";
import { ApiResponse } from "@/api/core/types";

/**
 * Hook for fetching tags for selection lists, with optional entity type filtering
 */
export const useSelectionTags = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ["tags", entityType],
    queryFn: async () => {
      logger.info(`Fetching tags${entityType ? ` for ${entityType}` : ''}`);
      
      const response = await apiClient.query(async (client) => {
        let query = client
          .from("tags")
          .select("*");
          
        // Filter by entity type if provided
        if (entityType) {
          // Get tags that can be used with this entity type
          const { data: entityTypeTags } = await client
            .from("tag_entity_types")
            .select("tag_id")
            .eq("entity_type", entityType);
          
          if (entityTypeTags && entityTypeTags.length > 0) {
            const tagIds = entityTypeTags.map((et) => et.tag_id);
            query = query.in("id", tagIds);
          }
        }
        
        return await query.order("name");
      });
      
      return response;
    }
  });
};

/**
 * Hook for fetching tags assigned to a specific entity
 */
export const useEntityTags = (entityId?: string, entityType?: EntityType) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: async () => {
      if (!entityId || !entityType) return { data: [] };
      
      logger.info(`Fetching tags for ${entityType} ${entityId}`);
      
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from("tag_assignments")
          .select(`
            *,
            tag:tags(*)
          `)
          .eq("target_id", entityId)
          .eq("target_type", entityType);
          
        if (error) throw error;
        
        return { data: data || [] };
      });
    },
    enabled: !!entityId && !!entityType
  });
};

/**
 * Hook for filtering entities by tag
 */
export const useFilterTags = (tagId: string | null, entityType?: EntityType) => {
  return useQuery({
    queryKey: ["filter-by-tag", tagId, entityType],
    queryFn: async () => {
      if (!tagId) return [];
      
      logger.info(`Filtering by tag ${tagId}${entityType ? ` and entity type ${entityType}` : ''}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        let query = client
          .from("tag_assignments")
          .select(`
            *,
            tag:tags(*)
          `)
          .eq("tag_id", tagId);
          
        // Add entity type filter if provided
        if (entityType) {
          query = query.eq("target_type", entityType);
        }
        
        return await query;
      });
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!tagId
  });
};

/**
 * Alias for useFilterTags with better naming for some use cases
 */
export const useFilterByTag = useFilterTags;

/**
 * Hook for tag CRUD operations
 */
export const useTagCrudMutations = () => {
  const queryClient = useQueryClient();
  
  // Create tag
  const createMutation = useMutation({
    mutationFn: async (tag: Omit<Tag, "id" | "created_at" | "updated_at">) => {
      logger.info("Creating tag:", tag);
      
      const { data, error } = await apiClient.query(async (client) => {
        const result = await client
          .from("tags")
          .insert(tag)
          .select()
          .single();
          
        return result;
      });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      logger.error("Error creating tag:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Update tag
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Tag>) => {
      logger.info(`Updating tag ${id}:`, updates);
      
      const { data, error } = await apiClient.query(async (client) => {
        const result = await client
          .from("tags")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
          
        return result;
      });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag updated successfully");
    },
    onError: (error) => {
      logger.error("Error updating tag:", error);
      toast.error(`Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Delete tag
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.info(`Deleting tag ${id}`);
      
      const { error } = await apiClient.query(async (client) => {
        return await client
          .from("tags")
          .delete()
          .eq("id", id);
      });
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted successfully");
    },
    onError: (error) => {
      logger.error("Error deleting tag:", error);
      toast.error(`Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    createTag: createMutation.mutateAsync,
    updateTag: updateMutation.mutateAsync,
    deleteTag: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};

/**
 * Hook for tag assignment mutations
 */
export const useTagAssignmentMutations = () => {
  const queryClient = useQueryClient();
  
  // Assign tag to entity
  const assignMutation = useMutation({
    mutationFn: async ({ 
      tagId, 
      entityId, 
      entityType 
    }: { 
      tagId: string; 
      entityId: string; 
      entityType: EntityType;
    }) => {
      logger.info(`Assigning tag ${tagId} to ${entityType} ${entityId}`);
      
      const { data, error } = await apiClient.query(async (client) => {
        // Check if assignment already exists
        const { data: existingAssignments } = await client
          .from("tag_assignments")
          .select()
          .eq("tag_id", tagId)
          .eq("target_id", entityId)
          .eq("target_type", entityType);
          
        // If already assigned, just return the existing assignment
        if (existingAssignments && existingAssignments.length > 0) {
          return { data: existingAssignments[0], error: null };
        }
        
        // Create new assignment
        return await client
          .from("tag_assignments")
          .insert({
            tag_id: tagId,
            target_id: entityId,
            target_type: entityType
          })
          .select()
          .single();
      });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate entity tags
      queryClient.invalidateQueries({ 
        queryKey: ["entity-tags", variables.entityId, variables.entityType] 
      });
      
      // Invalidate any entity queries
      if (variables.entityType === EntityType.EVENT) {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      } else if (variables.entityType === EntityType.PERSON) {
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
      } else if (variables.entityType === EntityType.ORGANIZATION) {
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
      }
      
      toast.success("Tag assigned successfully");
    },
    onError: (error) => {
      logger.error("Error assigning tag:", error);
      toast.error(`Failed to assign tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Remove tag assignment
  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      logger.info(`Removing tag assignment ${assignmentId}`);
      
      const { error } = await apiClient.query(async (client) => {
        return await client
          .from("tag_assignments")
          .delete()
          .eq("id", assignmentId);
      });
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      
      toast.success("Tag removed successfully");
    },
    onError: (error) => {
      logger.error("Error removing tag:", error);
      toast.error(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    assignTag: assignMutation.mutateAsync,
    removeTagAssignment: removeMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    isRemoving: removeMutation.isPending
  };
};
