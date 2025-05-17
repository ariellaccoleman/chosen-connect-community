
import { DataRepository } from "./DataRepository";
import { CrudRepositoryOperations } from "./operations/crudOperations";
import { QueryRepositoryOperations } from "./operations/queryOperations";
import { ApiResponse } from "../types";

/**
 * Standard operations that can be applied to any repository.
 * Combines CRUD and query operations
 */
export class StandardRepositoryOperations<T, TId = string> {
  private crudOps: CrudRepositoryOperations<T, TId>;
  private queryOps: QueryRepositoryOperations<T, TId>;
  
  constructor(
    repository: DataRepository<T>,
    entityName: string = "Entity"
  ) {
    this.crudOps = new CrudRepositoryOperations<T, TId>(repository, entityName);
    this.queryOps = new QueryRepositoryOperations<T, TId>(repository, entityName);
  }
  
  // CRUD Operations
  async getById(id: TId): Promise<ApiResponse<T | null>> {
    return this.crudOps.getById(id);
  }
  
  async getAll(): Promise<ApiResponse<T[]>> {
    return this.crudOps.getAll();
  }
  
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.crudOps.create(data);
  }
  
  async update(id: TId, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.crudOps.update(id, data);
  }
  
  async delete(id: TId): Promise<ApiResponse<boolean>> {
    return this.crudOps.delete(id);
  }
  
  // Query Operations
  async getByIds(ids: TId[]): Promise<ApiResponse<T[]>> {
    return this.queryOps.getByIds(ids);
  }
  
  async findBy(field: string, value: any): Promise<ApiResponse<T[]>> {
    return this.queryOps.findBy(field, value);
  }
  
  async search(field: string, searchTerm: string): Promise<ApiResponse<T[]>> {
    return this.queryOps.search(field, searchTerm);
  }
  
  // Core Operations
  async exists(id: TId): Promise<boolean> {
    return this.queryOps.exists(id);
  }
  
  async count(column: string, value: any): Promise<number> {
    return this.queryOps.count(column, value);
  }
}

/**
 * Create standard repository operations for a repository
 */
export function createStandardOperations<T, TId = string>(
  repository: DataRepository<T>,
  entityName: string = "Entity"
): StandardRepositoryOperations<T, TId> {
  return new StandardRepositoryOperations<T, TId>(repository, entityName);
}
