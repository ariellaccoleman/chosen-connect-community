
/**
 * Tag assignment operations using the API factory pattern - cleaned up version
 * Updated to use repository layer for proper client injection
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { createSupabaseRepository } from '@/api/core/repository/SupabaseRepository';

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
  return {
    /**
     * Get all enriched tag assignments with optional filters
     */
    async getAll(options: {
      filters?: Record<string, any>;
      search?: string;
      searchColumns?: string[];
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      offset?: number;
      select?: string;
    } = {}): Promise<ApiResponse<any[]>> {
      try {
        // Create a repository for the view with client injection
        const viewRepo = createSupabaseRepository('entity_tag_assignments_view', client);
        
        const {
          filters = {},
          orderBy = 'created_at',
          ascending = false,
          limit,
          offset,
          select = '*'
        } = options;

        let query = viewRepo.select(select);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        // Apply ordering
        query = query.order(orderBy, { ascending });

        // Apply pagination
        if (limit !== undefined) {
          const from = offset || 0;
          const to = from + limit - 1;
          query = query.range(from, to);
        }

        const result = await query.execute();
        
        if (result.isError()) {
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

// Default exports for backwards compatibility
export const tagAssignmentCoreOperations = createTagAssignmentCoreOperations();
export const enrichedTagAssignmentOperations = createEnrichedTagAssignmentOperations();
