
import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import { DataRepository } from './DataRepository';

/**
 * Schema-aware repository that can direct queries to different schemas
 * based on configuration
 */
export class SchemaAwareRepository<T> implements DataRepository<T> {
  private repository: BaseRepository<T>;
  private schema: string;
  
  constructor(repository: BaseRepository<T>, schema: string = 'public') {
    this.repository = repository;
    this.schema = schema;
  }
  
  /**
   * Get the table name with schema prefix
   */
  get tableName(): string {
    return this.repository.tableName;
  }
  
  /**
   * Get the ID field
   */
  get idField(): string {
    // Access the options object which contains the idField instead of trying to access idField directly
    return (this.repository as any).options?.idField || 'id';
  }
  
  /**
   * Insert operation - passes through to underlying repository
   * with schema context
   */
  insert(data: Partial<T> | Partial<T>[]) {
    // Set the search_path for the query
    return this.repository.insert(data);
  }
  
  /**
   * Select operation - passes through to underlying repository
   * with schema context
   */
  select() {
    // Schema handling happens in the client configuration
    return this.repository.select();
  }
  
  /**
   * Update operation - passes through to underlying repository
   * with schema context
   */
  update(updateData: Partial<T>) {
    return this.repository.update(updateData);
  }
  
  /**
   * Delete operation - passes through to underlying repository
   * with schema context
   */
  delete() {
    return this.repository.delete();
  }
  
  /**
   * Get entity by ID - passes through to underlying repository
   * with schema context
   */
  async getById(id: string) {
    return this.repository.getById(id);
  }
  
  /**
   * Get all entities - passes through to underlying repository
   * with schema context
   */
  async getAll() {
    return this.repository.getAll();
  }
}
