
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
// These now support providedClient parameter following the relationships API pattern
export const getAllTags = (params?: any, providedClient?: any) => extendedTagApi.getAll(params);
export const getTagById = (id: string, providedClient?: any) => extendedTagApi.getById(id);
export const findTagByName = (name: string, providedClient?: any) => extendedTagApi.findByName(name, providedClient);
export const searchTags = (searchQuery: string, providedClient?: any) => extendedTagApi.searchByName(searchQuery, providedClient);
export const createTag = (data: any, providedClient?: any) => extendedTagApi.create(data);
export const updateTag = (id: string, data: any, providedClient?: any) => extendedTagApi.update(id, data);
export const deleteTag = (id: string, providedClient?: any) => extendedTagApi.delete(id);
export const findOrCreateTag = (data: any, entityType?: any, providedClient?: any) => extendedTagApi.findOrCreate(data, entityType, providedClient);
export const getTagsByEntityType = (entityType: any, providedClient?: any) => extendedTagApi.getByEntityType(entityType, providedClient);

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: any, providedClient?: any) => tagAssignmentApi.getForEntity(entityId, entityType, providedClient);
export const createTagAssignment = (tagId: string, entityId: string, entityType: any, providedClient?: any) => tagAssignmentApi.create(tagId, entityId, entityType, providedClient);
export const deleteTagAssignment = (id: string, providedClient?: any) => tagAssignmentApi.delete(id);

// Re-export core operations for direct access if needed
export { tagCoreOperations } from './tagCoreOperations';
