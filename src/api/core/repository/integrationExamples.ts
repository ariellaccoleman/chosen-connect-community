import { createRepository, DataRepository } from "./repositoryFactory";
import { createStandardOperations, StandardRepositoryOperations } from "./standardOperations";
import { EntityType } from "@/types/entityTypes";
import { ApiResponse } from "../types";

/**
 * Example of creating typed repositories for entity types
 */
export function createEntityRepository<T>(
  entityType: EntityType, 
  tableName: string,
  mockData?: T[]
): DataRepository<T> {
  // Use testing schema in test environments
  if (process.env.NODE_ENV === 'test') {
    // Fix: Pass options object as the second parameter instead of separate arguments
    return createRepository<T>(tableName, { schema: 'testing' });
  }
  
  // Use Supabase repository in other environments
  return createRepository<T>(tableName);
}

/**
 * Example of using standard operations with entity repository
 */
export function createEntityOperations<T>(
  entityType: EntityType,
  tableName: string,
  mockData?: T[]
): StandardRepositoryOperations<T> {
  const repository = createEntityRepository<T>(entityType, tableName, mockData);
  const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  return createStandardOperations<T>(repository, entityName);
}

/**
 * Example of abstracting entity-specific operations
 */
export class EntityOperations<T> {
  private operations: StandardRepositoryOperations<T>;
  
  constructor(
    private entityType: EntityType,
    tableName: string,
    mockData?: T[]
  ) {
    const repository = createEntityRepository<T>(entityType, tableName, mockData);
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    this.operations = createStandardOperations<T>(repository, entityName);
  }
  
  async getAll(): Promise<ApiResponse<T[]>> {
    return this.operations.getAll();
  }
  
  async getById(id: string): Promise<ApiResponse<T | null>> {
    return this.operations.getById(id);
  }
  
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.operations.create(data);
  }
  
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.operations.update(id, data);
  }
  
  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.operations.delete(id);
  }
  
  async search(term: string, field = 'name'): Promise<ApiResponse<T[]>> {
    return this.operations.search(field, term);
  }
  
  getEntityType(): EntityType {
    return this.entityType;
  }
}
