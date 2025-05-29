
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { createRelationshipHooks, createRelationshipMutationHook } from '@/hooks/core/factory/relationshipHooks';
import { createTagApiFactory, createTagAssignmentRelationshipApi } from '@/api/tags/factory/tagApiFactory';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory-based tag hooks that don't instantiate repositories at import time
 */

// Create tag API factory instance (lazy instantiation)
const createTagHooks = () => {
  const tagApi = createTagApiFactory();
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

/**
 * Hook to fetch tags for selection lists (factory-based)
 */
export function useSelectionTags(entityType?: EntityType) {
  const tagHooks = createTagHooks();
  return tagHooks.useList();
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
 * Hook to fetch tags for a specific entity (factory-based)
 */
export function useEntityTags(entityId: string, entityType: EntityType) {
  const tagAssignmentHooks = createTagAssignmentHooks();
  return tagAssignmentHooks.useGetAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });
}
