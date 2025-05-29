
/**
 * Tag assignment operations using the API factory pattern - cleaned up version
 * Updated to use ViewRepository for proper view access
 */
import { createApiFactory, createViewApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';

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
 * Factory function to create enriched tag assignment operations with optional client injection
 */
export function createEnrichedTagAssignmentOperations(client?: any) {
  // Create a view factory for the entity_tag_assignments_view using ViewRepository
  const viewFactory = createViewApiFactory<any>({
    viewName: 'entity_tag_assignments_view',
    entityName: 'EntityTagAssignment',
    defaultSelect: '*',
    transformResponse: (item: any) => item,
    enableLogging: false
  }, client);

  return {
    /**
     * Get all enriched tag assignments with optional filters
     */
    async getAll(options: {
      filters?: Record<string, any>;
      search?: string;
      searchColumns?: string[];
      ascending?: boolean;
      limit?: number;
      offset?: number;
      select?: string;
    } = {}): Promise<ApiResponse<any[]>> {
      try {
        const {
          filters = {},
          ascending = false,
          limit,
          offset,
          select = '*'
        } = options;

        // Use the view factory with ViewRepository
        const result = await viewFactory.getAll({
          filters,
          ascending,
          limit,
          offset,
          select
        });
        
        if (result.error) {
          return createErrorResponse(result.error);
        }
        
        const transformedData = (result.data || []).map((item: any) => ({
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
        }));
        
        return createSuccessResponse(transformedData);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}
