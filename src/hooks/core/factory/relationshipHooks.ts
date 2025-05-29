
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RelationshipApiOperations, ApiResponse } from '@/api/core/types';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';

/**
 * Configuration options for relationship hooks
 */
export interface RelationshipHookOptions {
  /**
   * Base query key for cache invalidation
   */
  queryKey: string;
  
  /**
   * Entity name for user-friendly messages
   */
  entityName: string;
  
  /**
   * Custom success/error messages
   */
  messages?: {
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
  };
  
  /**
   * Additional query keys to invalidate on mutations
   */
  additionalInvalidateKeys?: string[];
}

/**
 * Relationship-specific hooks interface
 * Excludes generic create hook, includes relationship-specific operations
 */
export interface RelationshipHooks<T, TId = string, TUpdate = Partial<T>> {
  // Query hooks
  useGetAll: (params?: any) => any;
  useGetById: (id: TId) => any;
  useGetByIds: (ids: TId[]) => any;
  
  // Mutation hooks (no generic create)
  useUpdate: () => any;
  useDelete: () => any;
  useBatchUpdate?: () => any;
  useBatchDelete?: () => any;
}

/**
 * Factory function to create relationship-specific hooks
 * Similar to queryHookFactory but designed for RelationshipApiOperations
 */
export function createRelationshipHooks<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>>(
  apiOperations: RelationshipApiOperations<T, TId, TCreate, TUpdate>,
  options: RelationshipHookOptions
): RelationshipHooks<T, TId, TUpdate> {
  const { queryKey, entityName, messages = {}, additionalInvalidateKeys = [] } = options;
  
  // Query hooks
  const useGetAll = (params?: any) => {
    return useQuery({
      queryKey: [queryKey, 'all', params],
      queryFn: () => apiOperations.getAll(params),
      select: (response: ApiResponse<T[]>) => response.data,
    });
  };
  
  const useGetById = (id: TId) => {
    return useQuery({
      queryKey: [queryKey, 'byId', id],
      queryFn: () => apiOperations.getById(id),
      select: (response: ApiResponse<T | null>) => response.data,
      enabled: !!id,
    });
  };
  
  const useGetByIds = (ids: TId[]) => {
    return useQuery({
      queryKey: [queryKey, 'byIds', ids],
      queryFn: () => apiOperations.getByIds(ids),
      select: (response: ApiResponse<T[]>) => response.data,
      enabled: ids.length > 0,
    });
  };
  
  // Mutation hooks
  const useUpdate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, data }: { id: TId; data: TUpdate }) => 
        apiOperations.update(id, data),
      onSuccess: () => {
        const successMessage = messages.updateSuccess || `Successfully updated ${entityName}`;
        toast.success(successMessage);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        additionalInvalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
      onError: (error: Error) => {
        const errorMessage = messages.updateError || `Failed to update ${entityName}. Please try again.`;
        logger.error(`Failed to update ${entityName}:`, error);
        toast.error(errorMessage);
      }
    });
  };
  
  const useDelete = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (id: TId) => apiOperations.delete(id),
      onSuccess: () => {
        const successMessage = messages.deleteSuccess || `Successfully deleted ${entityName}`;
        toast.success(successMessage);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        additionalInvalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
      onError: (error: Error) => {
        const errorMessage = messages.deleteError || `Failed to delete ${entityName}. Please try again.`;
        logger.error(`Failed to delete ${entityName}:`, error);
        toast.error(errorMessage);
      }
    });
  };
  
  // Batch operations (optional)
  const useBatchUpdate = apiOperations.batchUpdate ? () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (items: {id: TId, data: TUpdate}[]) => 
        apiOperations.batchUpdate!(items),
      onSuccess: (_, items) => {
        toast.success(`Successfully updated ${items.length} ${entityName}s`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        additionalInvalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
      onError: (error: Error) => {
        logger.error(`Failed to batch update ${entityName}s:`, error);
        toast.error(`Failed to update ${entityName}s. Please try again.`);
      }
    });
  } : undefined;
  
  const useBatchDelete = apiOperations.batchDelete ? () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (ids: TId[]) => apiOperations.batchDelete!(ids),
      onSuccess: (_, ids) => {
        toast.success(`Successfully deleted ${ids.length} ${entityName}s`);
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        additionalInvalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
      onError: (error: Error) => {
        logger.error(`Failed to batch delete ${entityName}s:`, error);
        toast.error(`Failed to delete ${entityName}s. Please try again.`);
      }
    });
  } : undefined;
  
  return {
    useGetAll,
    useGetById,
    useGetByIds,
    useUpdate,
    useDelete,
    ...(useBatchUpdate && { useBatchUpdate }),
    ...(useBatchDelete && { useBatchDelete })
  };
}

/**
 * Helper function to create relationship-specific mutation hooks
 * For custom creation methods like createAssignment, createRelationship, etc.
 */
export function createRelationshipMutationHook<TParams, TResult>(
  mutationFn: (params: TParams) => Promise<ApiResponse<TResult>>,
  options: {
    queryKey: string;
    entityName: string;
    successMessage?: string;
    errorMessage?: string;
    additionalInvalidateKeys?: string[];
  }
) {
  const { queryKey, entityName, successMessage, errorMessage, additionalInvalidateKeys = [] } = options;
  
  return () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn,
      onSuccess: () => {
        const message = successMessage || `Successfully created ${entityName}`;
        toast.success(message);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        additionalInvalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
      onError: (error: Error) => {
        const message = errorMessage || `Failed to create ${entityName}. Please try again.`;
        logger.error(`Failed to create ${entityName}:`, error);
        toast.error(message);
      }
    });
  };
}
