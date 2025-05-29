
import { EntityType } from '@/types/entityTypes';
import { TagAssignment } from '@/utils/tags/types';
import { createTagAssignmentRelationshipApi } from '@/api/tags/factory/tagApiFactory';
import { createRelationshipHooks, createRelationshipMutationHook } from '@/hooks/core/factory/relationshipHooks';

/**
 * Tag Assignment Relationship API instance
 */
const tagAssignmentRelationshipApi = createTagAssignmentRelationshipApi();

/**
 * Core relationship hooks for tag assignments
 * Uses RelationshipApiOperations (no generic create method)
 */
const baseHooks = createRelationshipHooks(tagAssignmentRelationshipApi, {
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

/**
 * Relationship-specific creation hook for tag assignments
 */
export const useCreateTagAssignment = createRelationshipMutationHook(
  ({ tagId, entityId, entityType }: { tagId: string; entityId: string; entityType: EntityType }) =>
    tagAssignmentRelationshipApi.createAssignment(tagId, entityId, entityType),
  {
    queryKey: 'tag-assignments',
    entityName: 'tag assignment',
    successMessage: 'Successfully assigned tag',
    errorMessage: 'Failed to assign tag. Please try again.',
    additionalInvalidateKeys: ['tags', 'entity-tags']
  }
);

/**
 * Hook to get tag assignments for a specific entity
 */
export const useTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => {
  return baseHooks.useGetAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });
};

/**
 * Hook to get entities that have a specific tag assigned
 */
export const useEntitiesByTag = (tagId: string, entityType?: EntityType) => {
  return baseHooks.useGetAll({ 
    filters: { 
      tag_id: tagId,
      ...(entityType && { target_type: entityType })
    } 
  });
};

/**
 * Relationship-specific deletion hook for tag assignments by tag and entity
 */
export const useDeleteTagAssignmentByTagAndEntity = createRelationshipMutationHook(
  ({ tagId, entityId, entityType }: { tagId: string; entityId: string; entityType: EntityType }) =>
    tagAssignmentRelationshipApi.deleteByTagAndEntity(tagId, entityId, entityType),
  {
    queryKey: 'tag-assignments',
    entityName: 'tag assignment',
    successMessage: 'Successfully removed tag',
    errorMessage: 'Failed to remove tag. Please try again.',
    additionalInvalidateKeys: ['tags', 'entity-tags']
  }
);

/**
 * Hook to delete all tag assignments for an entity
 */
export const useDeleteTagAssignmentsForEntity = createRelationshipMutationHook(
  ({ entityId, entityType }: { entityId: string; entityType: EntityType }) =>
    tagAssignmentRelationshipApi.deleteForEntity(entityId, entityType),
  {
    queryKey: 'tag-assignments',
    entityName: 'tag assignments',
    successMessage: 'Successfully removed all tags',
    errorMessage: 'Failed to remove tags. Please try again.',
    additionalInvalidateKeys: ['tags', 'entity-tags']
  }
);

/**
 * Hook to check if a tag is assigned to an entity
 */
export const useIsTagAssigned = (tagId: string, entityId: string, entityType: EntityType) => {
  return baseHooks.useGetAll({
    filters: {
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    }
  });
};

// Export core relationship hooks
export const {
  useGetAll: useGetAllTagAssignments,
  useGetById: useGetTagAssignmentById,
  useGetByIds: useGetTagAssignmentsByIds,
  useUpdate: useUpdateTagAssignment,
  useDelete: useDeleteTagAssignment
} = baseHooks;
