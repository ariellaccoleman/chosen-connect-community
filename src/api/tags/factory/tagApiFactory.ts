
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
 * Cached API instances
 */
let cachedTagApi: any = null;
let cachedExtendedTagApi: any = null;
let cachedTagAssignmentApi: any = null;
let cachedExtendedTagAssignmentApi: any = null;
let cachedTagAssignmentRelationshipApi: any = null;

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

// Initialize cached instances with default client
if (!cachedTagApi) {
  cachedTagApi = createExtendedTagApi();
}
if (!cachedTagAssignmentApi) {
  cachedTagAssignmentApi = createExtendedTagAssignmentApi();
}
if (!cachedTagAssignmentRelationshipApi) {
  cachedTagAssignmentRelationshipApi = createTagAssignmentRelationshipApi();
}

// Default exports - cached instances
export const tagApi = cachedTagApi;
export const tagAssignmentApi = cachedTagAssignmentApi;

/**
 * Reset tag APIs with authenticated client
 */
export function resetTagApis(authenticatedClient: any) {
  cachedTagApi = createExtendedTagApi(authenticatedClient);
  cachedTagAssignmentApi = createExtendedTagAssignmentApi(authenticatedClient);
  cachedTagAssignmentRelationshipApi = createTagAssignmentRelationshipApi(authenticatedClient);
  
  return {
    tagApi: cachedTagApi,
    tagAssignmentApi: cachedTagAssignmentApi,
    tagAssignmentRelationshipApi: cachedTagAssignmentRelationshipApi
  };
}

// Factory functions for creating API instances (for testing and custom usage)
export function createTagApiFactory(client?: any) {
  return createTagApi(client);
}

export function createTagAssignmentApiFactory(client?: any) {
  return createTagAssignmentApi(client);
}

// DEPRECATED: Simplified function exports - will be removed in next phase
// These use the problematic default exports
export const getAllTags = cachedTagApi.getAll;
export const getTagById = cachedTagApi.getById;
export const createTag = cachedTagApi.create;
export const updateTag = cachedTagApi.update;
export const deleteTag = cachedTagApi.delete;
export const findTagByName = (name: string) => cachedTagApi.getAll({ filters: { name } });
export const searchTags = cachedTagApi.searchByName;
export const findOrCreateTag = cachedTagApi.findOrCreate;
export const getTagsByEntityType = cachedTagApi.getByEntityType;

// Tag assignment function exports
export const getTagAssignmentsForEntity = (entityId: string, entityType: EntityType) => 
  cachedTagAssignmentApi.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });

export const createTagAssignment = cachedTagAssignmentApi.createAssignment;
export const deleteTagAssignment = cachedTagAssignmentApi.delete;

// Re-export core operations for direct access if needed
export { createTagCoreOperations } from './tagCoreOperations';
export { createTagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
