
/**
 * Tag API Factory - Main entry point using factory configuration
 */
import { extendedTagOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

// Export the factory-based APIs
export const extendedTagApi = extendedTagOperations;
export const tagAssignmentApi = tagAssignmentCoreOperations;
export const tagApi = extendedTagApi; // For backward compatibility

// Factory functions for creating API instances (for consistency with other APIs)
export function createTagApiFactory() {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory() {
  return tagAssignmentApi;
}

// Individual function exports for backward compatibility with index.ts
export const getAllTags = extendedTagApi.getAll;
export const getTagById = extendedTagApi.getById;
export const findTagByName = extendedTagApi.findByName;
export const searchTags = extendedTagApi.searchByName;
export const createTag = extendedTagApi.create;
export const updateTag = extendedTagApi.update;
export const deleteTag = extendedTagApi.delete;
export const findOrCreateTag = extendedTagApi.findOrCreate;
export const getTagsByEntityType = extendedTagApi.getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = tagAssignmentApi.getForEntity;
export const createTagAssignment = tagAssignmentApi.create;
export const deleteTagAssignment = tagAssignmentApi.delete;

// Re-export core operations for direct access if needed
export { tagCoreOperations } from './tagCoreOperations';
