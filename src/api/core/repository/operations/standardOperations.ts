
import { DataRepository } from "../DataRepository";
import { CrudRepositoryOperations } from "./crudOperations";
import { QueryRepositoryOperations } from "./queryOperations";

/**
 * Standard operations that can be applied to any repository.
 * Combines CRUD and query operations
 */
export class StandardRepositoryOperations<T, TId = string> 
  extends CrudRepositoryOperations<T, TId> {
  
  // Add query operations
  private queryOps: QueryRepositoryOperations<T, TId>;
  
  constructor(
    repository: DataRepository<T>,
    entityName: string = "Entity"
  ) {
    super(repository, entityName);
    this.queryOps = new QueryRepositoryOperations<T, TId>(repository, entityName);
    
    // Bind query operations after initialization
    this.setupQueryOperations();
  }
  
  // Setup method to bind query operations after initialization
  private setupQueryOperations(): void {
    this.getByIds = this.queryOps.getByIds.bind(this.queryOps);
    this.findBy = this.queryOps.findBy.bind(this.queryOps);
    this.search = this.queryOps.search.bind(this.queryOps);
  }
  
  // Declare the methods that will be bound
  getByIds: typeof QueryRepositoryOperations.prototype.getByIds;
  findBy: typeof QueryRepositoryOperations.prototype.findBy;
  search: typeof QueryRepositoryOperations.prototype.search;
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
