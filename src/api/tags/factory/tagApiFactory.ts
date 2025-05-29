
/**
 * Tag API Factory - Simplified structure with two main APIs
 */
import { tagCoreOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations, enrichedTagAssignmentOperations } from './tagAssignmentCoreOperations';
import { tagBusinessOperations } from './tagBusinessOperations';
import { tagAssignmentBusinessOperations } from './tagAssignmentBusinessOperations';
import { EntityType } from '@/types/entityTypes';

// Main tag API - combines core CRUD + business operations
export const tagApi = {
  // Core CRUD operations from factory
  ...tagCoreOperations,
  // Business operations (includes findOrCreate, searchByName, getByEntityType)
  ...tagBusinessOperations
};

// Main tag assignment API - combines core CRUD + business operations + enriched views
export const tagAssignmentApi = {
  // Core CRUD operations from factory
  ...tagAssignmentCoreOperations,
  // Business operations
  ...tagAssignmentBusinessOperations,
  // Enriched operations for views
  getAllEnriched: enrichedTagAssignmentOperations.getAll
};

// Factory functions for creating API instances (mainly for testing)
export function createTagApiFactory() {
  return tagApi;
}

export function createTagAssignmentApiFactory() {
  return tagAssignmentApi;
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
export { tagCoreOperations } from './tagCoreOperations';
export { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';
