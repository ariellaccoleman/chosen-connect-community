
import { ApiOperations, ListParams } from "@/api/core/types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiResponse } from "@/api/core/errorHandler";
import { EntityConfig, QueryOptionsType } from "./types";

/**
 * Creates standardized read query hooks for an entity type
 */
export function createReadHooks<
  T,
  TId = string
>(
  entityConfig: EntityConfig,
  apiOperations: Pick<ApiOperations<T, TId>, "getAll" | "getById" | "getByIds">
) {
  const entityName = entityConfig.name;
  const pluralName = entityConfig.pluralName || `${entityName}s`;

  /**
   * Hook for fetching all entities with optional filtering
   */
  const useList = (
    params?: ListParams,
    options?: QueryOptionsType<T[]>
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
    options?: QueryOptionsType<T | null>
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

  return {
    useList,
    useById,
    useByIds
  };
}
