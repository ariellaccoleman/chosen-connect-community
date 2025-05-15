
import { supabase } from '@/integrations/supabase/client';
import { DataRepository, RepositoryQuery, RepositoryResponse } from './DataRepository';
import { logger } from '@/utils/logger';

/**
 * Supabase implementation of the DataRepository interface
 */
export class SupabaseRepository<T = any> implements DataRepository<T> {
  tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Create a select query
   */
  select(selectQuery = '*'): RepositoryQuery<T> {
    const query = supabase
      .from(this.tableName as any)
      .select(selectQuery);
    
    return new SupabaseQuery<T>(query);
  }

  /**
   * Create an insert query
   */
  insert(data: any): RepositoryQuery<T> {
    const query = supabase
      .from(this.tableName as any)
      .insert(data);
    
    return new SupabaseQuery<T>(query);
  }

  /**
   * Create an update query
   */
  update(data: any): RepositoryQuery<T> {
    const query = supabase
      .from(this.tableName as any)
      .update(data);
    
    return new SupabaseQuery<T>(query);
  }

  /**
   * Create a delete query
   */
  delete(): RepositoryQuery<T> {
    const query = supabase
      .from(this.tableName as any)
      .delete();
    
    return new SupabaseQuery<T>(query);
  }
}

/**
 * Supabase implementation of the RepositoryQuery interface
 */
class SupabaseQuery<T> implements RepositoryQuery<T> {
  private query: any;

  constructor(query: any) {
    this.query = query;
  }

  eq(column: string, value: any): RepositoryQuery<T> {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any): RepositoryQuery<T> {
    this.query = this.query.neq(column, value);
    return this;
  }

  in(column: string, values: any[]): RepositoryQuery<T> {
    this.query = this.query.in(column, values);
    return this;
  }

  ilike(column: string, pattern: string): RepositoryQuery<T> {
    this.query = this.query.ilike(column, pattern);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): RepositoryQuery<T> {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number): RepositoryQuery<T> {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number): RepositoryQuery<T> {
    this.query = this.query.range(from, to);
    return this;
  }

  // Add this method to satisfy the error about select not existing
  select(select = '*'): RepositoryQuery<T> {
    this.query = this.query.select(select);
    return this;
  }

  async single(): Promise<RepositoryResponse<T>> {
    try {
      const { data, error } = await this.query.single();
      
      return {
        data: data as T || null,
        error: error
      };
    } catch (error) {
      logger.error('Error executing single query:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    try {
      const { data, error } = await this.query.maybeSingle();
      
      return {
        data: data as T || null,
        error: error
      };
    } catch (error) {
      logger.error('Error executing maybeSingle query:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.query;
      
      return {
        data: data as T[] || [],
        error: error
      };
    } catch (error) {
      logger.error('Error executing query:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

/**
 * Create a Supabase repository for a specific table
 */
export function createSupabaseRepository<T>(tableName: string): DataRepository<T> {
  return new SupabaseRepository<T>(tableName);
}
