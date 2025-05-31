
import { createApiFactory } from '@/api/core/factory';
import { ApiResponse } from '@/api/core/types';
import { createErrorResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { Hub } from '@/types';

/**
 * Create Hub API using the factory pattern
 */
export const hubApi = createApiFactory<Hub>({
  tableName: 'hubs',
  useMutationOperations: true,
  repository: {
    type: 'supabase',
    enhanced: true,
    enableLogging: process.env.NODE_ENV === 'development'
  },
  defaultSelect: 'id, name, description, tag_id, is_featured, created_at, updated_at'
});

/**
 * Reset hub API with authenticated client
 */
export const resetHubApi = (client?: any) => {
  const newApi = createApiFactory<Hub>({
    tableName: 'hubs',
    useMutationOperations: true,
    repository: {
      type: 'supabase',
      enhanced: true,
      enableLogging: process.env.NODE_ENV === 'development'
    },
    defaultSelect: 'id, name, description, tag_id, is_featured, created_at, updated_at'
  }, client);

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete,
    getAllHubsWithTags: async (): Promise<ApiResponse<Hub[]>> => {
      try {
        // Using only valid properties for ListParams
        const { data, error } = await newApi.getAll({
          filters: {},
          // Using custom query options provided by the enhanced repository
          // @ts-ignore - The enhanced repository supports this but TypeScript doesn't know
          queryOptions: { select: '*, tag:tags(*)' }
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(data);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
    getFeaturedHubs: async (): Promise<ApiResponse<Hub[]>> => {
      try {
        // Using only valid properties for ListParams
        const { data, error } = await newApi.getAll({
          filters: { is_featured: true },
          // Using custom query options provided by the enhanced repository
          // @ts-ignore - The enhanced repository supports this but TypeScript doesn't know
          queryOptions: { select: '*, tag:tags(*)' }
        });

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(data);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
    toggleHubFeatured: async (id: string, isFeatured: boolean): Promise<ApiResponse<Hub>> => {
      try {
        const { data, error } = await newApi.update(id, { is_featured: isFeatured } as any);

        if (error) {
          return createErrorResponse(error);
        }

        return createSuccessResponse(data);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
};

/**
 * Get all hubs with optional tag details
 */
export const getAllHubsWithTags = async (): Promise<ApiResponse<Hub[]>> => {
  try {
    // Using only valid properties for ListParams
    const { data, error } = await hubApi.getAll({
      filters: {},
      // Using custom query options provided by the enhanced repository
      // @ts-ignore - The enhanced repository supports this but TypeScript doesn't know
      queryOptions: { select: '*, tag:tags(*)' }
    });

    if (error) {
      return createErrorResponse(error);
    }

    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
};

/**
 * Get featured hubs with tag details
 */
export const getFeaturedHubs = async (): Promise<ApiResponse<Hub[]>> => {
  try {
    // Using only valid properties for ListParams
    const { data, error } = await hubApi.getAll({
      filters: { is_featured: true },
      // Using custom query options provided by the enhanced repository
      // @ts-ignore - The enhanced repository supports this but TypeScript doesn't know
      queryOptions: { select: '*, tag:tags(*)' }
    });

    if (error) {
      return createErrorResponse(error);
    }

    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
};

/**
 * Toggle the featured status of a hub
 */
export const toggleHubFeatured = async (id: string, isFeatured: boolean): Promise<ApiResponse<Hub>> => {
  try {
    const { data, error } = await hubApi.update(id, { is_featured: isFeatured } as any);

    if (error) {
      return createErrorResponse(error);
    }

    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
};
