
/**
 * Tag API Factory - Main entry point using factory configuration
 * Simplified for better test client injection support
 */
import { tagCoreOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations, enrichedTagAssignmentOperations } from './tagAssignmentCoreOperations';
import { tagBusinessOperations } from './tagBusinessOperations';
import { tagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';
import { Tag, TagAssignment } from '@/utils/tags/types';

// Export the base factory-based APIs (support client injection)
export const tagApi = tagCoreOperations;
export const tagAssignmentApi = tagAssignmentCoreOperations;

// Export business operations with clean API
export const tagBusinessApi = {
  ...tagBusinessOperations,
  // Standard operations delegate to base factory
  getAll: tagCoreOperations.getAll,
  getById: tagCoreOperations.getById,
  create: tagCoreOperations.create,
  update: tagCoreOperations.update,
  delete: tagCoreOperations.delete,
};

export const tagAssignmentBusinessApi = {
  ...tagAssignmentBusinessOperations,
  // Standard operations delegate to base factory
  getAll: tagAssignmentCoreOperations.getAll,
  getById: tagAssignmentCoreOperations.getById,
  delete: tagAssignmentCoreOperations.delete,
  // Enhanced operations for views
  getAllEnriched: enrichedTagAssignmentOperations.getAll,
};

// Combined APIs for convenience
export const extendedTagApi = tagBusinessApi;
export const extendedTagAssignmentApi = tagAssignmentBusinessApi;

// Factory functions for creating API instances
export function createTagApiFactory() {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory() {
  return extendedTagAssignmentApi;
}

// Simplified function exports - direct delegation to base APIs
export const getAllTags = tagApi.getAll;
export const getTagById = tagApi.getById;
export const createTag = tagApi.create;
export const updateTag = tagApi.update;
export const deleteTag = tagApi.delete;

// Business operation exports
export const findTagByName = (name: string) => tagApi.getAll({ filters: { name } });
export const searchTags = tagBusinessOperations.searchByName;
export const findOrCreateTag = tagBusinessOperations.findOrCreate;
export const getTagsByEntityType = tagBusinessOperations.getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => 
  enrichedTagAssignmentOperations.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });

export const createTagAssignment = tagAssignmentBusinessOperations.create;
export const deleteTagAssignment = tagAssignmentApi.delete;

// Re-export core operations for direct access
export { tagCoreOperations } from './tagCoreOperations';
export { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

// For backward compatibility
export { tagApi as extendedTagOperations };
