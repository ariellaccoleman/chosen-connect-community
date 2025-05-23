
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
  select(columns = '*'): PostgrestFilterBuilder<T, any, any> {
    return supabase
      .from(this.tableName)
      .select(columns)
      .schema(this.schema);
  }

  /**
   * Insert query builder
   */
  insert(data: Partial<T> | Partial<T>[]): PostgrestFilterBuilder<T, any, any> {
    return supabase
      .from(this.tableName)
      .insert(data as any)
      .schema(this.schema);
  }

  /**
   * Update query builder
   */
  update(data: Partial<T>): PostgrestFilterBuilder<T, any, any> {
    return supabase
      .from(this.tableName)
      .update(data as any)
      .schema(this.schema);
  }

  /**
   * Delete query builder
   */
  delete(): PostgrestFilterBuilder<T, any, any> {
    return supabase
      .from(this.tableName)
      .delete()
      .schema(this.schema);
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<RepositoryResponse<T>> {
    return this.select().eq('id', id).maybeSingle();
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<RepositoryResponse<T[]>> {
    return this.select().execute();
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
