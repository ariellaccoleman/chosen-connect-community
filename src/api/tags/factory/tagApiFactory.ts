
/**
 * Tag API Factory - Updated to comply with ApiOperations interface for hook factory pattern
 */
import { createTagCoreOperations } from './tagCoreOperations';
import { createTagAssignmentCoreOperations, createEnrichedTagAssignmentOperations } from './tagAssignmentCoreOperations';
import { createTagBusinessOperations } from './tagBusinessOperations';
import { createTagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';
import { ApiOperations } from '@/api/core/factory/types';

/**
 * Factory function to create tag API with ApiOperations interface compliance
 */
export function createTagApi(client?: any): ApiOperations<any> {
  const coreOps = createTagCoreOperations(client);
  const businessOps = createTagBusinessOperations(client);
  
  return {
    // Core CRUD operations - standardized interface
    getAll: coreOps.getAll,
    getById: coreOps.getById,
    create: coreOps.create,
    update: coreOps.update,
    delete: coreOps.delete,
    
    // Business operations - accessible via extended interface
    findOrCreate: businessOps.findOrCreate,
    searchByName: businessOps.searchByName,
    getByEntityType: businessOps.getByEntityType
  };
}

/**
 * Factory function to create tag assignment API with ApiOperations interface compliance
 */
export function createTagAssignmentApi(client?: any): ApiOperations<any> {
  const coreOps = createTagAssignmentCoreOperations(client);
  const businessOps = createTagAssignmentBusinessOperations(client);
  const enrichedOps = createEnrichedTagAssignmentOperations(client);
  
  return {
    // Core CRUD operations - standardized interface
    getAll: enrichedOps.getAll, // Use enriched version for tag assignments
    getById: coreOps.getById,
    create: (tagId: string, entityId: string, entityType: EntityType) => 
      coreOps.create(tagId, entityId, entityType),
    update: coreOps.update,
    delete: coreOps.delete,
    
    // Business operations - accessible via extended interface
    getEntitiesByTagId: businessOps.getEntitiesByTagId
  };
}

// DEPRECATED: Default exports - will be removed in next phase
// These cause repositories to be created at import time with unauthenticated client
export const tagApi = createTagApi();
export const tagAssignmentApi = createTagAssignmentApi();

// Factory functions for creating API instances (for testing and custom usage)
export function createTagApiFactory(client?: any) {
  return createTagApi(client);
}

export function createTagAssignmentApiFactory(client?: any) {
  return createTagAssignmentApi(client);
}

// DEPRECATED: Simplified function exports - will be removed in next phase
// These use the problematic default exports
export const getAllTags = tagApi.getAll;
export const getTagById = tagApi.getById;
export const createTag = tagApi.create;
export const updateTag = tagApi.update;
export const deleteTag = tagApi.delete;
export const findTagByName = (name: string) => tagApi.getAll({ filters: { name } });
export const searchTags = (tagApi as any).searchByName;
export const findOrCreateTag = (tagApi as any).findOrCreate;
export const getTagsByEntityType = (tagApi as any).getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => 
  tagAssignmentApi.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });

export const createTagAssignment = (tagApi as any).create;
export const deleteTagAssignment = tagAssignmentApi.delete;

// Re-export core operations for direct access if needed
export { createTagCoreOperations } from './tagCoreOperations';
export { createTagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
