
import { RelationshipApiOperations } from "../types";
import { DataRepository } from "../repository";
import { RelationshipFactoryOptions, RepositoryConfig, TableNames } from "./apiFactoryTypes";
import { createStandardApiFactory } from "./standardApiFactory";

/**
 * Creates a relationship API factory with standard RUD operations (no generic create)
 * Foundation for relationship-specific extensions
 * 
 * @param config - Configuration for the relationship API factory
 * @param providedClient - Optional Supabase client for testing/custom usage
 * @returns Relationship API operations with standard RUD operations
 */
export function createRelationshipApiFactory<
  T, 
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>({
  tableName,
  entityName,
  repository,
  useMutationOperations = true, // Enable mutations by default for relationships
  useBatchOperations = false,
  ...options
}: {
  tableName: Table;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
} & RelationshipFactoryOptions<T>, providedClient?: any): RelationshipApiOperations<T, TId, TCreate, TUpdate> {
  // Create the full API operations first
  const fullApiOps = createStandardApiFactory<T, TId, TCreate, TUpdate, Table>({
    tableName,
    entityName,
    repository,
    useMutationOperations,
    useBatchOperations,
    ...options
  }, providedClient);
  
  // Return only the relationship operations (omitting generic create)
  const {
    create, // Remove the generic create method
    ...relationshipOps
  } = fullApiOps;
  
  return relationshipOps as RelationshipApiOperations<T, TId, TCreate, TUpdate>;
}
