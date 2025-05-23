
import { BaseRepository } from './BaseRepository';
import { RepositoryResponse } from './DataRepository';

/**
 * Schema-aware repository wrapper that applies the specified schema
 * to all database operations.
 */
export class SchemaAwareRepository<T> {
  private baseRepository: BaseRepository<T>;
  private schema: string;

  constructor(baseRepository: BaseRepository<T>, schema: string) {
    this.baseRepository = baseRepository;
    this.schema = schema;
    
    // Set the schema on the base repository if it supports it
    if ((this.baseRepository as any).setSchema) {
      (this.baseRepository as any).setSchema(schema);
    }
  }

  /**
   * Delegates to all the base repository methods while ensuring schema is used
   */
  get tableName(): string {
    return this.baseRepository.tableName;
  }

  /** 
   * Select operation with schema awareness
   * @param columns Columns to select
   */
  select(columns?: string) {
    // Pass schema to select builder
    const selectBuilder = this.baseRepository.select(columns);
    if (selectBuilder.schema) {
      selectBuilder.schema(this.schema);
    }
    return selectBuilder;
  }

  /**
   * Insert operation with schema awareness
   * @param data Data to insert
   */
  insert(data: Partial<T> | Partial<T>[]) {
    // Pass schema to insert builder
    const insertBuilder = this.baseRepository.insert(data);
    if (insertBuilder.schema) {
      insertBuilder.schema(this.schema);
    }
    return insertBuilder;
  }

  /**
   * Update operation with schema awareness
   * @param data Data to update
   */
  update(data: Partial<T>) {
    // Pass schema to update builder
    const updateBuilder = this.baseRepository.update(data);
    if (updateBuilder.schema) {
      updateBuilder.schema(this.schema);
    }
    return updateBuilder;
  }

  /**
   * Delete operation with schema awareness
   */
  delete() {
    // Pass schema to delete builder
    const deleteBuilder = this.baseRepository.delete();
    if (deleteBuilder.schema) {
      deleteBuilder.schema(this.schema);
    }
    return deleteBuilder;
  }

  /**
   * Get an entity by ID with schema awareness
   * @param id The ID to lookup
   */
  async getById(id: string): Promise<RepositoryResponse<T>> {
    return this.select().eq('id', id).maybeSingle();
  }

  /**
   * Get all entities with schema awareness
   */
  async getAll(): Promise<RepositoryResponse<T[]>> {
    return this.select().execute();
  }
}
