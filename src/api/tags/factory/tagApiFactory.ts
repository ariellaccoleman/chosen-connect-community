
/**
 * Tag API Factory - Simplified structure with two main APIs and client injection support
 */
import { createTagCoreOperations } from './tagCoreOperations';
import { createTagAssignmentCoreOperations, createEnrichedTagAssignmentOperations } from './tagAssignmentCoreOperations';
import { createTagBusinessOperations } from './tagBusinessOperations';
import { createTagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory function to create tag API with optional client injection
 */
export function createTagApi(client?: any) {
  const coreOps = createTagCoreOperations(client);
  const businessOps = createTagBusinessOperations(client);
  
  return {
    // Core CRUD operations from factory
    ...coreOps,
    // Business operations (includes findOrCreate, searchByName, getByEntityType)
    ...businessOps
  };
}

/**
 * Factory function to create tag assignment API with optional client injection
 */
export function createTagAssignmentApi(client?: any) {
  const coreOps = createTagAssignmentCoreOperations(client);
  const businessOps = createTagAssignmentBusinessOperations(client);
  const enrichedOps = createEnrichedTagAssignmentOperations(client);
  
  return {
    // Core CRUD operations from factory
    ...coreOps,
    // Business operations
    ...businessOps,
    // Enriched operations for views
    getAllEnriched: enrichedOps.getAll
  };
}

// Default exports for backwards compatibility
export const tagApi = createTagApi();
export const tagAssignmentApi = createTagAssignmentApi();

// Factory functions for creating API instances (for testing and custom usage)
export function createTagApiFactory(client?: any) {
  return createTagApi(client);
}

export function createTagAssignmentApiFactory(client?: any) {
  return createTagAssignmentApi(client);
}

// Simplified function exports for direct usage
export const getAllTags = tagApi.getAll;
export const getTagById = tagApi.getById;
export const createTag = tagApi.create;
export const updateTag = tagApi.update;
export const deleteTag = tagApi.delete;
export const findTagByName = (name: string) => tagApi.getAll({ filters: { name } });
export const searchTags = tagApi.searchByName;
export const findOrCreateTag = tagApi.findOrCreate;
export const getTagsByEntityType = tagApi.getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => 
  tagAssignmentApi.getAllEnriched({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });

export const createTagAssignment = tagAssignmentApi.create;
export const deleteTagAssignment = tagAssignmentApi.delete;

// Re-export core operations for direct access if needed
export { createTagCoreOperations } from './tagCoreOperations';
export { createTagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
