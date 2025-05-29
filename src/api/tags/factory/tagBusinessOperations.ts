
/**
 * Tag business operations - complex operations that combine multiple steps
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag API using the factory pattern for base operations
const tagBase = createApiFactory<Tag>({
  tableName: 'tags',
  entityName: 'Tag',
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

// Business operations for tags that involve complex logic
export const tagBusinessOperations = {
  /**
   * Find or create a tag - complex business logic that combines find and create
   */
  async findOrCreate(data: Partial<Tag>, entityType?: EntityType, providedClient?: any): Promise<ApiResponse<Tag>> {
    // First try to find existing tag by name
    const existing = await tagBase.getAll({ filters: { name: data.name } }, providedClient);
    if (existing.error) {
      return {
        data: null,
        error: existing.error,
        status: 'error'
      };
    }
    
    if (existing.data && existing.data.length > 0) {
      return {
        data: existing.data[0],
        error: null,
        status: 'success'
      };
    }
    
    // Create new tag if not found
    if (providedClient) {
      try {
        const { data: newTag, error } = await providedClient
          .from('tags')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = {
          id: newTag.id,
          name: newTag.name,
          description: newTag.description,
          created_by: newTag.created_by,
          created_at: newTag.created_at,
          updated_at: newTag.updated_at
        };
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    return tagBase.create(data as any);
  }
};
