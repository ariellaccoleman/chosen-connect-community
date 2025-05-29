
/**
 * Tag business operations - complex operations that combine multiple steps
 * Updated to use repository layer for proper client injection
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { createSupabaseRepository } from '@/api/core/repository/SupabaseRepository';
import { createTagCoreOperations } from './tagCoreOperations';

/**
 * Factory function to create tag business operations with optional client injection
 */
export function createTagBusinessOperations(client?: any) {
  // Get client-aware core operations
  const tagBase = createTagCoreOperations(client);

  return {
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
     * Search tags by name pattern
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
      try {
        // Create a repository for the view with client injection
        const viewRepo = createSupabaseRepository('filtered_entity_tags_view', client);
        
        const result = await viewRepo
          .select('*')
          .eq('entity_type', entityType)
          .execute();

        if (result.isError()) {
          return createErrorResponse(result.error);
        }

        const transformedData = (result.data || []).map((item: any): Tag => ({
          id: item.id,
          name: item.name,
          description: item.description,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at,
          entity_types: [entityType]
        }));

        return createSuccessResponse(transformedData);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}

// Default export for backwards compatibility
export const tagBusinessOperations = createTagBusinessOperations();
