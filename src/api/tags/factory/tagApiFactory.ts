
/**
 * Tag API Factory - Updated to comply with ApiOperations interface for hook factory pattern
 */
import { createTagCoreOperations } from './tagCoreOperations';
import { createTagAssignmentCoreOperations, createEnrichedTagAssignmentOperations } from './tagAssignmentCoreOperations';
import { createTagBusinessOperations } from './tagBusinessOperations';
import { createTagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';
import { ApiOperations } from '@/api/core/types';
import { createRelationshipApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignmentRelationshipOperations } from './types';
import { TagAssignment } from '@/utils/tags/types';

/**
 * Factory function to create tag API with ApiOperations interface compliance
 * ONLY includes standard CRUD operations to comply with ApiOperations interface
 */
export function createTagApi(client?: any): ApiOperations<any> {
  const coreOps = createTagCoreOperations(client);
  
  return {
    // Core CRUD operations only - standardized interface
    getAll: coreOps.getAll,
    getById: coreOps.getById,
    getByIds: coreOps.getByIds,
    create: coreOps.create,
    update: coreOps.update,
    delete: coreOps.delete
  };
}

/**
 * Extended factory function to create tag API with full business operations interface
 */
export function createExtendedTagApi(client?: any) {
  const coreOps = createTagCoreOperations(client);
  const businessOps = createTagBusinessOperations(client);
  
  return {
    // Core CRUD operations - standardized interface
    getAll: coreOps.getAll,
    getById: coreOps.getById,
    getByIds: coreOps.getByIds,
    create: coreOps.create,
    update: coreOps.update,
    delete: coreOps.delete,
    
    // Business operations with proper typing
    findOrCreate: businessOps.findOrCreate,
    searchByName: businessOps.searchByName,
    getByEntityType: businessOps.getByEntityType
  };
}

/**
 * Factory function to create tag assignment API with ApiOperations interface compliance
 * ONLY includes standard CRUD operations to comply with ApiOperations interface
 */
export function createTagAssignmentApi(client?: any): ApiOperations<any> {
  const coreOps = createTagAssignmentCoreOperations(client);
  
  return {
    // Core CRUD operations only - standardized interface
    getAll: coreOps.getAll,
    getById: coreOps.getById,
    getByIds: coreOps.getByIds,
    create: coreOps.create,
    update: coreOps.update,
    delete: coreOps.delete
  };
}

/**
 * Factory function to create tag assignment relationship API
 * Uses RelationshipApiOperations interface with relationship-specific methods
 */
export function createTagAssignmentRelationshipApi(client?: any): TagAssignmentRelationshipOperations {
  // Create the base relationship operations (RUD only, no generic create)
  const relationshipOps = createRelationshipApiFactory<TagAssignment>({
    tableName: 'tag_assignments',
    entityName: 'TagAssignment',
    useMutationOperations: true,
    defaultSelect: '*',
    transformResponse: (item: any): TagAssignment => ({
      id: item.id,
      tag_id: item.tag_id,
      target_id: item.target_id,
      target_type: item.target_type,
      created_at: item.created_at,
      updated_at: item.updated_at
    }),
    // Relationship-specific configuration
    validateRelationship: (tagId: string, entityId: string, entityType?: string) => {
      return !!(tagId && entityId && entityType);
    },
    preventDuplicates: true,
    sourceEntityType: 'tag',
    targetEntityType: 'entity'
  }, client);
  
  // Get business operations for relationship-specific methods
  const businessOps = createTagAssignmentBusinessOperations(client);
  
  // Combine relationship operations with business-specific methods
  return {
    ...relationshipOps,
    
    // Relationship-specific creation method
    createAssignment: businessOps.create,
    
    // Business-specific query methods
    getForEntity: (entityId: string, entityType: EntityType) => 
      relationshipOps.getAll({ 
        filters: { 
          target_id: entityId, 
          target_type: entityType 
        } 
      }),
    
    getEntitiesByTagId: businessOps.getEntitiesByTagId,
    deleteByTagAndEntity: businessOps.deleteByTagAndEntity,
    deleteForEntity: businessOps.deleteForEntity,
    isTagAssigned: businessOps.isTagAssigned
  };
}

/**
 * Extended factory function to create tag assignment API with full business operations interface
 */
export function createExtendedTagAssignmentApi(client?: any) {
  const coreOps = createTagAssignmentCoreOperations(client);
  const businessOps = createTagAssignmentBusinessOperations(client);
  const enrichedOps = createEnrichedTagAssignmentOperations(client);
  
  return {
    // Core CRUD operations - standardized interface
    getAll: coreOps.getAll,
    getById: coreOps.getById,
    getByIds: coreOps.getByIds,
    create: coreOps.create,
    update: coreOps.update,
    delete: coreOps.delete,
    
    // Business operations with proper typing
    createAssignment: (tagId: string, entityId: string, entityType: EntityType) => 
      businessOps.create(tagId, entityId, entityType),
    getEntitiesByTagId: businessOps.getEntitiesByTagId,
    deleteByTagAndEntity: businessOps.deleteByTagAndEntity,
    deleteForEntity: businessOps.deleteForEntity,
    isTagAssigned: businessOps.isTagAssigned,
    
    // Enriched operations (read-only from view)
    getAllEnriched: enrichedOps.getAll
  };
}

/**
 * Reset all tag-related APIs with authenticated client
 * Returns an object matching all current exports from this factory
 */
export const resetApi = (client?: any) => {
  // Recreate all APIs with the provided client
  const newTagApi = createExtendedTagApi(client);
  const newTagAssignmentApi = createExtendedTagAssignmentApi(client);
  const newTagAssignmentRelationshipApi = createTagAssignmentRelationshipApi(client);

  return {
    // Factory functions
    createTagApi: () => createTagApi(client),
    createExtendedTagApi: () => createExtendedTagApi(client),
    createTagAssignmentApi: () => createTagAssignmentApi(client),
    createExtendedTagAssignmentApi: () => createExtendedTagAssignmentApi(client),
    createTagAssignmentRelationshipApi: () => createTagAssignmentRelationshipApi(client),
    
    // API instances
    tagApi: newTagApi,
    tagAssignmentApi: newTagAssignmentApi,
    tagAssignmentRelationshipApi: newTagAssignmentRelationshipApi,
    
    // Direct function exports matching current structure
    getAllTags: newTagApi.getAll,
    getTagById: newTagApi.getById,
    createTag: newTagApi.create,
    updateTag: newTagApi.update,
    deleteTag: newTagApi.delete,
    findTagByName: (name: string) => newTagApi.getAll({ filters: { name } }),
    searchTags: newTagApi.searchByName,
    findOrCreateTag: newTagApi.findOrCreate,
    getTagsByEntityType: newTagApi.getByEntityType,
    
    // Tag assignment function exports
    getTagAssignmentsForEntity: (entityId: string, entityType: EntityType) => 
      newTagAssignmentApi.getAll({ 
        filters: { 
          target_id: entityId, 
          target_type: entityType 
        } 
      }),
    createTagAssignment: newTagAssignmentApi.createAssignment,
    deleteTagAssignment: newTagAssignmentApi.delete
  };
};

// DEPRECATED: Default exports - will be removed in next phase
// These cause repositories to be created at import time with unauthenticated client
export const tagApi = createExtendedTagApi(); // Use extended for backward compatibility
export const tagAssignmentApi = createExtendedTagAssignmentApi(); // Use extended for backward compatibility

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
export const searchTags = tagApi.searchByName;
export const findOrCreateTag = tagApi.findOrCreate;
export const getTagsByEntityType = tagApi.getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => 
  tagAssignmentApi.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });

export const createTagAssignment = tagAssignmentApi.createAssignment;
export const deleteTagAssignment = tagAssignmentApi.delete;

// Re-export core operations for direct access if needed
export { createTagCoreOperations } from './tagCoreOperations';
export { createTagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
