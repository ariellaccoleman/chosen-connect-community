
/**
 * Tag assignment operations using the API factory pattern - cleaned up version
 * Updated to use entity_tag_assignments_view for enriched data
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';

// Create tag assignment API using the factory pattern for base operations
export const tagAssignmentCoreOperations = createApiFactory<TagAssignment>({
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
});

// Create enriched tag assignment API using the view for read operations
export const enrichedTagAssignmentOperations = createApiFactory<any>({
  tableName: 'entity_tag_assignments_view',
  entityName: 'EnrichedTagAssignment',
  useMutationOperations: false,
  defaultSelect: '*',
  transformResponse: (item: any) => ({
    id: item.id,
    tag_id: item.tag_id,
    target_id: item.target_id,
    target_type: item.target_type,
    created_at: item.created_at,
    updated_at: item.updated_at,
    tag: {
      id: item.tag_id,
      name: item.tag_name,
      description: item.tag_description,
      created_by: item.tag_created_by
    }
  })
});

// Note: All standard CRUD operations (getAll, getById, create, update, delete)
// are now provided by the base factory and don't need to be duplicated here.
// The enriched operations provide tag assignments with full tag details.
