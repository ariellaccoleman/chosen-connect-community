
/**
 * Tag core operations using the API factory pattern - base CRUD operations
 * Updated to use tags table with proper transformations and client injection support
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';

/**
 * Factory function to create tag core operations with optional client injection
 */
export function createTagCoreOperations(client?: any) {
  return createApiFactory<Tag>({
    tableName: 'tags',
    entityName: 'Tag',
    useMutationOperations: true,
    defaultSelect: '*',
    transformResponse: (item: any): Tag => ({
      id: item.id,
      name: item.name,
      description: item.description,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
      entity_types: item.entity_types || []
    })
  }, client);
}

// Default export for backwards compatibility
export const tagCoreOperations = createTagCoreOperations();
