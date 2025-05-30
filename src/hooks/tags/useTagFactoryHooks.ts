
import { useQuery } from '@tanstack/react-query';
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { createRelationshipHooks, createRelationshipMutationHook } from '@/hooks/core/factory/relationshipHooks';
import { createViewQueryHooks } from '@/hooks/core/factory/viewHookFactory';
import { createExtendedTagApi, createTagAssignmentRelationshipApi } from '@/api/tags/factory/tagApiFactory';
import { createEnrichedTagAssignmentOperations } from '@/api/tags/factory/tagAssignmentCoreOperations';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory-based tag hooks that don't instantiate repositories at import time
 */

// Create tag API factory instance (lazy instantiation)
const createTagHooks = () => {
  const tagApi = createExtendedTagApi();
  return createQueryHooks<Tag, string>(
    {
      name: 'tag',
      pluralName: 'tags', 
      displayName: 'Tag',
      pluralDisplayName: 'Tags'
    },
    tagApi
  );
};

// Create tag assignment relationship hooks (lazy instantiation)
const createTagAssignmentHooks = () => {
  const tagAssignmentApi = createTagAssignmentRelationshipApi();
  return createRelationshipHooks(tagAssignmentApi, {
    queryKey: 'tag-assignments',
    entityName: 'tag assignment',
    messages: {
      updateSuccess: 'Successfully updated tag assignment',
      updateError: 'Failed to update tag assignment. Please try again.',
      deleteSuccess: 'Successfully removed tag assignment',
      deleteError: 'Failed to remove tag assignment. Please try again.',
    },
    additionalInvalidateKeys: ['tags', 'entity-tags']
  });
};

// Create enriched tag assignment view hooks (lazy instantiation)
const createEnrichedTagAssignmentHooks = () => {
  const enrichedOperations = createEnrichedTagAssignmentOperations();
  return createViewQueryHooks<TagAssignment, string>(
    {
      name: 'entity-tag',
      pluralName: 'entity-tags',
      displayName: 'Entity Tag',
      pluralDisplayName: 'Entity Tags'
    },
    enrichedOperations
  );
};

/**
 * Hook to fetch tags for selection lists (factory-based)
 * Now properly filters by entity type when provided
 */
export function useSelectionTags(entityType?: EntityType) {
  return useQuery({
    queryKey: entityType ? ['tags', 'selection', entityType] : ['tags', 'selection', 'all'],
    queryFn: async () => {
      const tagApi = createExtendedTagApi();
      
      if (entityType) {
        // Get tags filtered by entity type
        const response = await tagApi.getByEntityType(entityType);
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch tags for entity type');
        }
        return response.data || [];
      } else {
        // Get all tags when no entity type is specified
        const response = await tagApi.getAll();
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch all tags');
        }
        return response.data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to filter entities by a selected tag (factory-based)
 */
export function useFilterByTag(tagId: string | null, entityType?: EntityType) {
  const tagAssignmentHooks = createTagAssignmentHooks();
  return tagAssignmentHooks.useGetAll({ 
    filters: { 
      tag_id: tagId,
      ...(entityType && { target_type: entityType })
    } 
  });
}

/**
 * Hook for CRUD operations on tags (factory-based)
 */
export function useTagCrudMutations() {
  const tagHooks = createTagHooks();
  
  return {
    createTag: tagHooks.useCreate().mutate,
    updateTag: tagHooks.useUpdate().mutate,
    deleteTag: tagHooks.useDelete().mutate,
    isCreating: tagHooks.useCreate().isPending,
    isUpdating: tagHooks.useUpdate().isPending,
    isDeleting: tagHooks.useDelete().isPending,
    error: tagHooks.useCreate().error || tagHooks.useUpdate().error || tagHooks.useDelete().error
  };
}

/**
 * Hook for tag assignment operations (factory-based)
 */
export function useTagAssignmentMutations() {
  const tagAssignmentApi = createTagAssignmentRelationshipApi();
  
  const assignTagMutation = createRelationshipMutationHook(
    ({ tagId, entityId, entityType }: { tagId: string, entityId: string, entityType: EntityType }) =>
      tagAssignmentApi.createAssignment(tagId, entityId, entityType),
    {
      queryKey: 'tag-assignments',
      entityName: 'tag assignment',
      successMessage: 'Successfully assigned tag',
      errorMessage: 'Failed to assign tag. Please try again.',
      additionalInvalidateKeys: ['tags', 'entity-tags']
    }
  );
  
  const removeTagMutation = createRelationshipMutationHook(
    (assignmentId: string) => tagAssignmentApi.delete(assignmentId),
    {
      queryKey: 'tag-assignments',
      entityName: 'tag assignment',
      successMessage: 'Successfully removed tag',
      errorMessage: 'Failed to remove tag. Please try again.',
      additionalInvalidateKeys: ['tags', 'entity-tags']
    }
  );
  
  return {
    assignTag: assignTagMutation().mutate,
    removeTagAssignment: removeTagMutation().mutate,
    isAssigning: assignTagMutation().isPending,
    isRemoving: removeTagMutation().isPending,
    error: assignTagMutation().error || removeTagMutation().error
  };
}

/**
 * Hook to fetch tags for a specific entity (factory-based with enriched data)
 */
export function useEntityTags(entityId: string, entityType: EntityType) {
  const enrichedHooks = createEnrichedTagAssignmentHooks();
  
  return enrichedHooks.useList({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });
}
