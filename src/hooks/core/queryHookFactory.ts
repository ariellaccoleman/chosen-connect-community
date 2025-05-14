
import { useQuery, useMutation, useQueryClient, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { ApiResponse } from "@/api/core/errorHandler";
import { ApiOperations, ListParams } from "@/api/core/types";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";
import { createMutationHandlers } from "@/utils/toastUtils";

/**
 * Factory function to create standardized React Query hooks for an entity type
 * 
 * @param entityConfig - Configuration for the entity
 * @param apiOperations - API operations created by the apiFactory
 * @returns Object with standardized query and mutation hooks
 */
export function createQueryHooks<
  T, 
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>
>(
  entityConfig: {
    /** Entity name for query keys, logging, and toast messages */
    name: string;
    /** Plural form of the entity name */
    pluralName?: string;
    /** Display name for user-facing messages */
    displayName?: string;
    /** Plural display name for user-facing messages */
    pluralDisplayName?: string;
  },
  apiOperations: ApiOperations<T, TId, TCreate, TUpdate>
) {
  // Generate derived values with sensible defaults
  const entityName = entityConfig.name;
  const pluralName = entityConfig.pluralName || `${entityName}s`;
  const displayName = entityConfig.displayName || entityName;
  const pluralDisplayName = entityConfig.pluralDisplayName || `${displayName}s`;

  /**
   * Hook for fetching all entities with optional filtering
   */
  const useList = (
    params?: ListParams,
    options?: UseQueryOptions<ApiResponse<T[]>>
  ) => {
    const queryKey = params ? [pluralName, params] : [pluralName];
    
    return useQuery({
      queryKey,
      queryFn: () => apiOperations.getAll(params),
      ...options
    });
  };

  /**
   * Hook for fetching a single entity by ID
   */
  const useById = (
    id: TId | null | undefined, 
    options?: UseQueryOptions<ApiResponse<T | null>>
  ) => {
    return useQuery({
      queryKey: [entityName, id],
      queryFn: () => apiOperations.getById(id as TId),
      enabled: !!id,
      ...options
    });
  };

  /**
   * Hook for fetching multiple entities by their IDs
   */
  const useByIds = (
    ids: TId[] | null | undefined, 
    options?: UseQueryOptions<ApiResponse<T[]>>
  ) => {
    return useQuery({
      queryKey: [pluralName, 'byIds', ids],
      queryFn: () => apiOperations.getByIds(ids as TId[]),
      enabled: !!ids && ids.length > 0,
      ...options
    });
  };

  /**
   * Hook for creating a new entity
   */
  const useCreate = (
    options?: UseMutationOptions<ApiResponse<T>, unknown, TCreate, unknown>
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${displayName} created successfully!`,
      errorMessagePrefix: `Failed to create ${displayName}`
    });
    
    return useMutation({
      mutationFn: apiOperations.create,
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  /**
   * Hook for updating an entity
   */
  const useUpdate = (
    options?: UseMutationOptions<
      ApiResponse<T>,
      unknown,
      { id: TId; data: TUpdate },
      unknown
    >
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${displayName} updated successfully!`,
      errorMessagePrefix: `Failed to update ${displayName}`
    });
    
    return useMutation({
      mutationFn: ({ id, data }) => apiOperations.update(id, data),
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        queryClient.invalidateQueries({ queryKey: [entityName, variables.id] });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  /**
   * Hook for deleting an entity
   */
  const useDelete = (
    options?: UseMutationOptions<ApiResponse<boolean>, unknown, TId, unknown>
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${displayName} deleted successfully!`,
      errorMessagePrefix: `Failed to delete ${displayName}`
    });
    
    return useMutation({
      mutationFn: apiOperations.delete,
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  /**
   * Hook for batch creating entities
   */
  const useBatchCreate = (
    options?: UseMutationOptions<ApiResponse<T[]>, unknown, TCreate[], unknown>
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${pluralDisplayName} created successfully!`,
      errorMessagePrefix: `Failed to create ${pluralDisplayName}`
    });
    
    return useMutation({
      mutationFn: apiOperations.batchCreate,
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  /**
   * Hook for batch updating entities
   */
  const useBatchUpdate = (
    options?: UseMutationOptions<
      ApiResponse<T[]>,
      unknown,
      { id: TId; data: TUpdate }[],
      unknown
    >
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${pluralDisplayName} updated successfully!`,
      errorMessagePrefix: `Failed to update ${pluralDisplayName}`
    });
    
    return useMutation({
      mutationFn: apiOperations.batchUpdate,
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        
        // For each updated entity, invalidate individual queries
        variables.forEach((item) => {
          queryClient.invalidateQueries({ queryKey: [entityName, item.id] });
        });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  /**
   * Hook for batch deleting entities
   */
  const useBatchDelete = (
    options?: UseMutationOptions<ApiResponse<boolean>, unknown, TId[], unknown>
  ) => {
    const queryClient = useQueryClient();
    const toastHandlers = createMutationHandlers({
      successMessage: `${pluralDisplayName} deleted successfully!`,
      errorMessagePrefix: `Failed to delete ${pluralDisplayName}`
    });
    
    return useMutation({
      mutationFn: apiOperations.batchDelete,
      onSuccess: (data, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [pluralName] });
        
        // Call toast handlers
        toastHandlers.onSuccess(data, variables);
      },
      onError: toastHandlers.onError,
      ...options
    });
  };

  // Return all hooks
  return {
    useList,
    useById,
    useByIds,
    useCreate,
    useUpdate,
    useDelete,
    useBatchCreate,
    useBatchUpdate,
    useBatchDelete
  };
}
