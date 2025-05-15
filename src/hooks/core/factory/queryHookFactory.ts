
import { ApiOperations } from "@/api/core/types";
import { EntityConfig } from "./types";
import { createReadHooks } from "./readHooks";
import { createMutationHooks } from "./mutationHooks";
import { createBatchMutationHooks } from "./batchMutationHooks";

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
  entityConfig: EntityConfig,
  apiOperations: ApiOperations<T, TId, TCreate, TUpdate>
) {
  // Generate derived values with sensible defaults
  const config = {
    name: entityConfig.name,
    pluralName: entityConfig.pluralName || `${entityConfig.name}s`,
    displayName: entityConfig.displayName || entityConfig.name,
    pluralDisplayName: entityConfig.pluralDisplayName || 
      (entityConfig.displayName ? `${entityConfig.displayName}s` : `${entityConfig.name}s`)
  };

  // Create read hooks (useList, useById, useByIds)
  const readHooks = createReadHooks<T, TId>(config, apiOperations);
  
  // Create mutation hooks (useCreate, useUpdate, useDelete)
  const mutationHooks = createMutationHooks<T, TId, TCreate, TUpdate>(config, apiOperations);

  // Create batch mutation hooks if the operations exist
  const batchMutationHooks = apiOperations.batchCreate && apiOperations.batchUpdate && apiOperations.batchDelete
    ? createBatchMutationHooks<T, TId, TCreate, TUpdate>(config, apiOperations)
    : {};

  // Return all hooks
  return {
    ...readHooks,
    ...mutationHooks,
    ...batchMutationHooks
  };
}

export * from "./types";
