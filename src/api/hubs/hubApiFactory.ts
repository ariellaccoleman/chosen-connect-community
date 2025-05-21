
import { createApiFactory } from '@/api/core/factory';
import { ApiResponse } from '@/api/core/types';
import { Hub } from '@/types';

/**
 * Create Hub API using the factory pattern
 */
export const hubApi = createApiFactory<Hub>({
  tableName: 'hubs',
  useQueryOperations: true,
  useMutationOperations: true,
  repository: {
    type: 'supabase',
    enhanced: true,
    enableLogging: process.env.NODE_ENV === 'development'
  },
  defaultSelect: 'id, name, description, tag_id, is_featured, created_at, updated_at'
});

/**
 * Get all hubs with optional tag details
 */
export const getAllHubsWithTags = async (): Promise<ApiResponse<Hub[]>> => {
  try {
    const { data, error } = await hubApi.getAll({
      select: '*, tag:tags(*)'
    });

    if (error) {
      return { status: 'error', error, data: null };
    }

    return { status: 'success', data, error: null };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
      data: null,
    };
  }
};

/**
 * Get featured hubs with tag details
 */
export const getFeaturedHubs = async (): Promise<ApiResponse<Hub[]>> => {
  try {
    const { data, error } = await hubApi.getAll({
      select: '*, tag:tags(*)',
      filters: { is_featured: true }
    });

    if (error) {
      return { status: 'error', error, data: null };
    }

    return { status: 'success', data, error: null };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
      data: null,
    };
  }
};

/**
 * Toggle the featured status of a hub
 */
export const toggleHubFeatured = async (id: string, isFeatured: boolean): Promise<ApiResponse<Hub>> => {
  try {
    const { data, error } = await hubApi.update(id, { is_featured: isFeatured });

    if (error) {
      return { status: 'error', error, data: null };
    }

    return { status: 'success', data, error: null };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
      data: null,
    };
  }
};
