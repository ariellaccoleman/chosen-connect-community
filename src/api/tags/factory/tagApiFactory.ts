
/**
 * Tag API Factory - Main entry point using factory configuration
 */
import { tagCoreOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
import { tagBusinessOperations } from './tagBusinessOperations';
import { tagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';

// Export the factory-based APIs
export const tagApi = tagCoreOperations;
export const tagAssignmentApi = tagAssignmentCoreOperations;

// Export business operations separately
export const extendedTagApi = {
  ...tagCoreOperations,
  ...tagBusinessOperations
};

export const extendedTagAssignmentApi = {
  ...tagAssignmentCoreOperations,
  ...tagAssignmentBusinessOperations
};

// For backward compatibility with existing code
export { tagApi as extendedTagOperations };

// Factory functions for creating API instances (for consistency with other APIs)
export function createTagApiFactory() {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory() {
  return extendedTagAssignmentApi;
}

// Individual function exports for backward compatibility - now much simpler
export const getAllTags = (optionsOrClient?: any, providedClient?: any) => tagApi.getAll(optionsOrClient, providedClient);
export const getTagById = (id: string, providedClient?: any) => tagApi.getById(id, providedClient);
export const findTagByName = (name: string, providedClient?: any) => tagApi.findByName(name, providedClient);
export const searchTags = (searchQuery: string, providedClient?: any) => tagApi.searchByName(searchQuery, providedClient);
export const createTag = (data: any, providedClient?: any) => tagApi.create(data, providedClient);
export const updateTag = (id: string, data: any, providedClient?: any) => tagApi.update(id, data, providedClient);
export const deleteTag = (id: string, providedClient?: any) => tagApi.delete(id, providedClient);
export const findOrCreateTag = (data: any, entityType?: EntityType, providedClient?: any) => tagBusinessOperations.findOrCreate(data, entityType, providedClient);
export const getTagsByEntityType = (entityType: EntityType, providedClient?: any) => tagApi.getByEntityType(entityType, providedClient);

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType, providedClient?: any) => tagAssignmentApi.getAll({ filters: { target_id: entityId, target_type: entityType } }, providedClient);
export const createTagAssignment = (tagId: string, entityId: string, entityType: EntityType, providedClient?: any) => tagAssignmentBusinessOperations.create(tagId, entityId, entityType, providedClient);
export const deleteTagAssignment = (assignmentId: string, providedClient?: any) => tagAssignmentApi.delete(assignmentId, providedClient);

// Re-export core operations for direct access if needed
export { tagCoreOperations } from './tagCoreOperations';
