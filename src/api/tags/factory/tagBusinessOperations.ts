
/**
 * Tag business operations - complex operations that combine multiple steps
 * Updated to use proper database views for entity type filtering
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag API using the factory pattern for base operations on the main tags table
const tagBase = createApiFactory<Tag>({
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
    updated_at: item.updated_at
  })
});

// Create a view-based API for filtered entity tags
const filteredEntityTagsApi = createApiFactory<Tag>({
  tableName: 'filtered_entity_tags_view',
  entityName: 'FilteredEntityTag',
  useMutationOperations: false,
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

// Business operations for tags that involve complex logic
export const tagBusinessOperations = {
  /**
   * Find or create a tag with the given data
   */
  async findOrCreate(tagData: Partial<Tag>, entityType?: EntityType): Promise<ApiResponse<Tag>> {
    // First try to find existing tag by name
    if (tagData.name) {
      const existingResponse = await tagBase.getAll({ 
        filters: { name: tagData.name } 
      });
      
      if (existingResponse.data && existingResponse.data.length > 0) {
        return {
          data: existingResponse.data[0],
          error: null,
          status: 'success'
        };
      }
    }
    
    // Create new tag if not found
    return tagBase.create(tagData as any);
  },

  /**
   * Search tags by name pattern using the all_tags view
   */
  async searchByName(searchQuery: string): Promise<ApiResponse<Tag[]>> {
    if (!searchQuery.trim()) {
      return {
        data: [],
        error: null,
        status: 'success'
      };
    }
    
    return tagBase.getAll({ search: searchQuery });
  },

  /**
   * Get tags by entity type using the filtered_entity_tags_view
   */
  async getByEntityType(entityType: EntityType): Promise<ApiResponse<Tag[]>> {
    return filteredEntityTagsApi.getAll({ 
      filters: { entity_type: entityType } 
    });
  }
};
