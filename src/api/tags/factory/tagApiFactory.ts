
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
  ...tagBusinessOperations,
  // Add convenience methods that use base operations
  findByName: (name: string) => {
    return tagCoreOperations.getAll({ filters: { name } });
  },
  searchByName: (searchQuery: string) => {
    return tagCoreOperations.getAll({ search: searchQuery });
  },
  getByEntityType: (entityType: EntityType) => {
    return tagCoreOperations.getAll({ filters: { entity_type: entityType } });
  }
};

export const extendedTagAssignmentApi = {
  ...tagAssignmentCoreOperations,
  ...tagAssignmentBusinessOperations,
  // Add convenience method that uses base operations
  getForEntity: (entityId: string, entityType: EntityType) => {
    return tagAssignmentCoreOperations.getAll({ 
      filters: { 
        target_id: entityId, 
        target_type: entityType 
      } 
    });
  }
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
export const getAllTags = (optionsOrClient?: any) => tagApi.getAll(optionsOrClient);
export const getTagById = (id: string) => tagApi.getById(id);
export const findTagByName = (name: string) => extendedTagApi.findByName(name);
export const searchTags = (searchQuery: string) => extendedTagApi.searchByName(searchQuery);
export const createTag = (data: any) => tagApi.create(data);
export const updateTag = (id: string, data: any) => tagApi.update(id, data);
export const deleteTag = (id: string) => tagApi.delete(id);
export const findOrCreateTag = (data: any, entityType?: EntityType) => tagBusinessOperations.findOrCreate(data, entityType);
export const getTagsByEntityType = (entityType: EntityType) => extendedTagApi.getByEntityType(entityType);

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => extendedTagAssignmentApi.getForEntity(entityId, entityType);
export const createTagAssignment = (tagId: string, entityId: string, entityType: EntityType) => tagAssignmentBusinessOperations.create(tagId, entityId, entityType);
export const deleteTagAssignment = (assignmentId: string) => tagAssignmentApi.delete(assignmentId);

// Re-export core operations for direct access if needed
export { tagCoreOperations } from './tagCoreOperations';
