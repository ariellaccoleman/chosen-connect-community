import { useQuery } from "@tanstack/react-query";
import { EntityConfig, QueryOptionsType } from "./types";
import { ViewOperations } from "@/api/core/factory/types";
import { logger } from "@/utils/logger";

/**
 * Creates a read-only React Query hook for a view with pre-configured options.
 *
 * @param viewOperations - The view operations object.
 * @param entityConfig - Configuration for the entity, including names and display properties.
 * @param queryOptions - Optional, additional options to pass to the useQuery hook.
 *
 * @returns A useQuery hook pre-configured for the specified view.
 */
export const createViewQueryHook = <T, TId = string>(
  viewOperations: ViewOperations<T, TId>,
  entityConfig: EntityConfig,
  queryOptions: Omit<QueryOptionsType<T>, 'queryKey' | 'queryFn'> = {}
) => {
  const { name } = entityConfig;

  /**
   * Custom hook to fetch a single entity by ID.
   *
   * @param id - The ID of the entity to fetch.
   * @param options - Optional, additional options to pass to the useQuery hook.
   *
   * @returns useQuery hook pre-configured for fetching a single entity.
   */
  const useGetViewItem = (
    id: TId,
    options: Omit<QueryOptionsType<T>, 'queryKey' | 'queryFn'> = {}
  ) => {
    const queryKey = [name, 'view', id];

    return useQuery<any>({
      queryKey,
      queryFn: async () => {
        logger.debug(`[useGet${name}] Fetching ${name} with id: ${id}`);
        const result = await viewOperations.getById(id);

        if (result.status === 'error') {
          logger.error(`[useGet${name}] Error fetching ${name} with id: ${id}`, result.error);
          throw result.error;
        }

        return result.data;
      },
      ...queryOptions,
      ...options,
    });
  };

  /**
   * Custom hook to fetch all entities.
   *
   * @param params - Optional parameters for filtering, searching, and pagination.
   * @param options - Optional, additional options to pass to the useQuery hook.
   *
   * @returns useQuery hook pre-configured for fetching all entities.
   */
  const useGetViewAll = (
    params: Parameters<ViewOperations<T, TId>['getAll']>[0] = {},
    options: Omit<QueryOptionsType<T[]>, 'queryKey' | 'queryFn'> = {}
  ) => {
    const queryKey = [name, 'view', 'all', params];

    return useQuery<any>({
      queryKey,
      queryFn: async () => {
        logger.debug(`[useGetAll${name}] Fetching all ${name}`);
        const result = await viewOperations.getAll(params);

        if (result.status === 'error') {
          logger.error(`[useGetAll${name}] Error fetching all ${name}`, result.error);
          throw result.error;
        }

        return result.data;
      },
      ...queryOptions,
      ...options,
    });
  };

  return {
    useGetViewItem,
    useGetViewAll,
  };
};
