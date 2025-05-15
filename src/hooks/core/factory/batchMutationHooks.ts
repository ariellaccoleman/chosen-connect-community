
import { ApiOperations } from "@/api/core/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMutationHandlers } from "@/utils/toastUtils";
import { EntityConfig, MutationOptionsType } from "./types";

/**
 * Creates standardized batch mutation hooks for an entity type
 */
export function createBatchMutationHooks<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>
>(
  entityConfig: EntityConfig,
  apiOperations: Pick<ApiOperations<T, TId, TCreate, TUpdate>, "batchCreate" | "batchUpdate" | "batchDelete">
) {
  const entityName = entityConfig.name;
  const pluralName = entityConfig.pluralName || `${entityName}s`;
  const displayName = entityConfig.displayName || entityName;
  const pluralDisplayName = entityConfig.pluralDisplayName || `${displayName}s`;

  /**
   * Hook for batch creating entities
   */
  const useBatchCreate = (
    options?: MutationOptionsType<T[], TCreate[]>
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
    options?: MutationOptionsType<T[], { id: TId; data: TUpdate }[]>
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
    options?: MutationOptionsType<boolean, TId[]>
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

  return {
    useBatchCreate,
    useBatchUpdate,
    useBatchDelete
  };
}
