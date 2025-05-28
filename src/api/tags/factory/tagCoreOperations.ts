
/**
 * Tag operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag API using the factory pattern
export const tagCoreOperations = createApiFactory<Tag>({
  tableName: 'tags',
  entityName: 'Tag',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*',
  defaultOrderBy: 'name',
  transformResponse: (item: any): Tag => ({
    id: item.id,
    name: item.name,
    description: item.description,
    created_by: item.created_by,
    created_at: item.created_at,
    updated_at: item.updated_at
  })
});

// Extended operations for tag-specific logic
export const extendedTagOperations = {
  ...tagCoreOperations,
  
  async findByName(name: string): Promise<ApiResponse<Tag | null>> {
    return tagCoreOperations.findOne({ name });
  },
  
  async searchByName(searchQuery: string): Promise<ApiResponse<Tag[]>> {
    return tagCoreOperations.getAll({ 
      filters: { name: { ilike: `%${searchQuery}%` } } 
    });
  },
  
  async getByEntityType(entityType: EntityType): Promise<ApiResponse<Tag[]>> {
    // This would need to join with tag_entity_types, but for now return all tags
    // The filtering will be handled at the application level
    return tagCoreOperations.getAll();
  },
  
  async findOrCreate(data: Partial<Tag>, entityType?: EntityType): Promise<ApiResponse<Tag>> {
    // First try to find existing tag
    const existing = await this.findByName(data.name!);
    if (existing.data) {
      return existing as ApiResponse<Tag>;
    }
    
    // Create new tag if not found
    return tagCoreOperations.create(data);
  }
};
