
/**
 * Tag core operations using the API factory pattern - base CRUD operations
 * Updated to use all_tags_with_entity_types_view for proper entity type support
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';

// Create tag API using the factory pattern - this provides all standard CRUD operations
// Now uses the view that includes entity types for better data consistency
export const tagCoreOperations = createApiFactory<Tag>({
  tableName: 'all_tags_with_entity_types_view',
  entityName: 'Tag',
  useMutationOperations: true,
  defaultSelect: '*',
  transformResponse: (item: any): Tag => ({
    id: item.id,
    name: item.name,
    description: item.description,
    created_by: item.created_by,
    created_at: item.created_at,
    updated_at: item.updated_at
  })
});

// Note: All standard CRUD operations (getAll, getById, create, update, delete)
// are now provided by the base factory and don't need to be duplicated here.
// The view provides tags with their entity types already joined.
