
import { ApiOperations } from "@/api/core/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMutationHandlers } from "@/utils/toastUtils";
import { EntityConfig, MutationOptionsType } from "./types";

/**
 * Creates standardized mutation hooks for an entity type
 */
export function createMutationHooks<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>
>(
  entityConfig: EntityConfig,
  apiOperations: Pick<ApiOperations<T, TId, TCreate, TUpdate>, "create" | "update" | "delete">
) {
  const entityName = entityConfig.name;
  const pluralName = entityConfig.pluralName || `${entityName}s`;
  const displayName = entityConfig.displayName || entityName;
  const pluralDisplayName = entityConfig.pluralDisplayName || `${displayName}s`;

  /**
   * Hook for creating a new entity
   */
  const useCreate = (
    options?: MutationOptionsType<T, TCreate>
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
    options?: MutationOptionsType<T, { id: TId; data: TUpdate }>
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
    options?: MutationOptionsType<boolean, TId>
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

  return {
    useCreate,
    useUpdate,
    useDelete
  };
}
