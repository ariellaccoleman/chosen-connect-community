
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ViewOperations } from '@/api/core/factory/types';

export interface ViewHookConfig {
  name: string;
  pluralName: string;
  displayName: string;
  pluralDisplayName: string;
}

/**
 * Factory function to create React Query hooks for view operations
 * Views are read-only, so we only provide query hooks (no mutations)
 */
export function createViewQueryHooks<T, ID = string>(
  config: ViewHookConfig,
  viewOperations: ViewOperations<T>
) {
  const { name, pluralName } = config;

  // Hook to get all items from the view with optional filters
  const useList = (options?: { filters?: Record<string, any> }) => {
    return useQuery({
      queryKey: [pluralName, options?.filters || {}],
      queryFn: () => viewOperations.getAll(options),
      select: (response) => response.data || response,
    });
  };

  // Hook to get a single item by ID
  const useById = (id: ID | null | undefined, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: [name, id],
      queryFn: () => {
        if (!id) throw new Error(`${config.displayName} ID is required`);
        return viewOperations.getById(id);
      },
      enabled: !!id && (options?.enabled !== false),
      select: (response) => response.data || response,
    });
  };

  return {
    useList,
    useById,
  };
}
