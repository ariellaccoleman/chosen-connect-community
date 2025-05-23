
import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { BaseRepository } from './BaseRepository';
import { DataRepository, RepositoryResponse } from './DataRepository';

/**
 * Implementation of DataRepository using Supabase as the data store.
 */
export class SupabaseRepository<T> implements BaseRepository<T> {
  tableName: string;
  private currentSchema: string | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Set the schema to use for all operations
   */
  setSchema(schema: string) {
    this.currentSchema = schema;
  }

  /**
   * Select query builder
   */
  select(columns = '*'): PostgrestFilterBuilder<T, any, any> {
    let query = supabase
      .from(this.tableName)
      .select(columns);
      
    // Apply schema if set
    if (this.currentSchema) {
      query = query.schema(this.currentSchema);
    }
    
    return query;
  }

  /**
   * Insert query builder
   */
  insert(data: Partial<T> | Partial<T>[]): PostgrestFilterBuilder<T, any, any> {
    let query = supabase
      .from(this.tableName)
      .insert(data);
      
    // Apply schema if set
    if (this.currentSchema) {
      query = query.schema(this.currentSchema);
    }
    
    return query;
  }

  /**
   * Update query builder
   */
  update(data: Partial<T>): PostgrestFilterBuilder<T, any, any> {
    let query = supabase
      .from(this.tableName)
      .update(data);
      
    // Apply schema if set
    if (this.currentSchema) {
      query = query.schema(this.currentSchema);
    }
    
    return query;
  }

  /**
   * Delete query builder
   */
  delete(): PostgrestFilterBuilder<T, any, any> {
    let query = supabase
      .from(this.tableName)
      .delete();
      
    // Apply schema if set
    if (this.currentSchema) {
      query = query.schema(this.currentSchema);
    }
    
    return query;
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
