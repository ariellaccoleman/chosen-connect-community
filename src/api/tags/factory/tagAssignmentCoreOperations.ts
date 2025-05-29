
/**
 * Tag assignment core operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from './types';

/**
 * Factory function to create tag assignment core operations with optional client injection
 */
export function createTagAssignmentCoreOperations(client?: any) {
  return createApiFactory<TagAssignment>({
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
    })
  }, client);
}

/**
 * Factory function to create enriched tag assignment operations with tag details
 */
export function createEnrichedTagAssignmentOperations(client?: any) {
  return createApiFactory<any>({
    tableName: 'entity_tag_assignments_view',
    entityName: 'EnrichedTagAssignment',
    useMutationOperations: false, // View is read-only
    defaultSelect: '*',
    transformResponse: (item: any) => ({
      id: item.id,
      tag_id: item.tag_id,
      target_id: item.target_id,
      target_type: item.target_type,
      created_at: item.created_at,
      updated_at: item.updated_at,
      tag_name: item.tag_name,
      tag_description: item.tag_description,
      tag_created_by: item.tag_created_by,
      entity_types: item.entity_types || []
    })
  }, client);
}

// Default exports for backwards compatibility
export const tagAssignmentCoreOperations = createTagAssignmentCoreOperations();
export const enrichedTagAssignmentOperations = createEnrichedTagAssignmentOperations();
