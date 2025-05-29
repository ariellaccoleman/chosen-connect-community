
/**
 * Tag assignment operations using the API factory pattern - cleaned up version
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';

// Create tag assignment API using the factory pattern - this provides all standard CRUD operations
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

// Note: All standard CRUD operations (getAll, getById, create, update, delete)
// are now provided by the base factory and don't need to be duplicated here.
// The getForEntity method is available as getAll with filters.
