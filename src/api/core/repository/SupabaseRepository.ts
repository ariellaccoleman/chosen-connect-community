
import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import { DataRepository, RepositoryResponse } from './DataRepository';

/**
 * Implementation of DataRepository using Supabase as the data store.
 */
export class SupabaseRepository<T> implements BaseRepository<T> {
  tableName: string;
  private schema: string;

  constructor(tableName: string, schema: string = 'public') {
    this.tableName = tableName;
    this.schema = schema;
  }

  /**
   * Set the schema to use for all operations
   */
  setSchema(schema: string) {
    this.schema = schema;
  }

  /**
   * Get the current schema
   */
  getSchema(): string {
    return this.schema;
  }

  /**
   * Select query builder
   */
  select(columns = '*') {
    // Use options object to set schema instead of method chaining
    return supabase
      .from(this.tableName)
      .select(columns, { schema: this.schema });
  }

  /**
   * Insert query builder
   */
  insert(data: Partial<T> | Partial<T>[]) {
    // Use options object to set schema instead of method chaining
    return supabase
      .from(this.tableName)
      .insert(data as any, { schema: this.schema });
  }

  /**
   * Update query builder
   */
  update(data: Partial<T>) {
    // Use options object to set schema instead of method chaining
    return supabase
      .from(this.tableName)
      .update(data as any, { schema: this.schema });
  }

  /**
   * Delete query builder
   */
  delete() {
    // Use options object to set schema instead of method chaining
    return supabase
      .from(this.tableName)
      .delete({ schema: this.schema });
  }

  /**
   * Get entity by ID
   */
  async getById(id: string | number): Promise<T> {
    const response = await this.select().eq('id', id).maybeSingle();
    if (response.error) throw response.error;
    return response.data as T;
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    const response = await this.select().execute();
    if (response.error) throw response.error;
    return response.data as T[];
  }
}

/**
 * Factory function to create a Supabase repository
 */
export function createSupabaseRepository<T>(
  tableName: string, 
  schema: string = 'public'
): BaseRepository<T> {
  return new SupabaseRepository<T>(tableName, schema);
}
