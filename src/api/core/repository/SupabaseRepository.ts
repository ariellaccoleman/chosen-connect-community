import { supabase } from '@/integrations/supabase/client';
import { RepositoryQuery, RepositoryResponse, RepositoryError } from './DataRepository';
import { BaseRepository } from './BaseRepository';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleRepositoryError } from './repositoryUtils';

/**
 * Supabase implementation of the BaseRepository abstract class
 */
export class SupabaseRepository<T = any> extends BaseRepository<T> {
  private supabaseClient: any;
  private schema: string;

  constructor(tableName: string, client?: any, schema: string = 'public') {
    super(tableName);
    this.supabaseClient = client || supabase;
    this.schema = schema;
  }

  /**
   * Set the schema to use for database operations
   * @param schema The schema name
   */
  setSchema(schema: string): void {
    this.schema = schema;
  }

  /**
   * Get the current schema name
   * @returns The current schema name
   */
  getSchema(): string {
    return this.schema;
  }

  /**
   * Create a select query
   */
  select(selectQuery = '*'): RepositoryQuery<T> {
    try {
      // Cast the tableName to any to bypass the type checking,
      // as we're allowing dynamic table names that might not be in the type system
      const query = this.supabaseClient
        .from(this.tableName as any)
        .select(selectQuery, { schema: this.schema });
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating select query for ${this.tableName}:`, error);
      // Return a query that will return an error when executed
      return new ErrorQuery<T>(error, `select from ${this.tableName}`);
    }
  }

  /**
   * Create an insert query
   */
  insert(data: Record<string, any> | Record<string, any>[]): RepositoryQuery<T> {
    try {
      // Cast the tableName to any to bypass the type checking
      const query = this.supabaseClient
        .from(this.tableName as any)
        .insert(data, { schema: this.schema });
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating insert query for ${this.tableName}:`, error);
      return new ErrorQuery<T>(error, `insert into ${this.tableName}`);
    }
  }

  /**
   * Create an update query
   */
  update(data: Record<string, any>): RepositoryQuery<T> {
    try {
      // Cast the tableName to any to bypass the type checking
      const query = this.supabaseClient
        .from(this.tableName as any)
        .update(data, { schema: this.schema });
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating update query for ${this.tableName}:`, error);
      return new ErrorQuery<T>(error, `update ${this.tableName}`);
    }
  }

  /**
   * Create a delete query
   */
  delete(): RepositoryQuery<T> {
    try {
      // Cast the tableName to any to bypass the type checking
      const query = this.supabaseClient
        .from(this.tableName as any)
        .delete({ schema: this.schema });
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating delete query for ${this.tableName}:`, error);
      return new ErrorQuery<T>(error, `delete from ${this.tableName}`);
    }
  }

  /**
   * Get a record by ID
   * 
   * @param id ID of the record to get
   * @returns Promise with the record
   */
  async getById(id: string | number): Promise<T | null> {
    try {
      const result = await this.select()
        .eq('id', id)
        .single();
      
      if (result.isError()) {
        logger.error(`Error getting ${this.tableName} by ID ${id}:`, result.error);
        return null;
      }
      
      return result.data as T;
    } catch (error) {
      logger.error(`Error in getById for ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Get all records
   * 
   * @returns Promise with all records
   */
  async getAll(): Promise<T[]> {
    try {
      const result = await this.select().execute();
      
      if (result.isError()) {
        logger.error(`Error getting all ${this.tableName}:`, result.error);
        return [];
      }
      
      return result.data as T[];
    } catch (error) {
      logger.error(`Error in getAll for ${this.tableName}:`, error);
      return [];
    }
  }
}

/**
 * Supabase implementation of the RepositoryQuery interface
 */
class SupabaseQuery<T> implements RepositoryQuery<T> {
  private query: any;
  private context: string;
  private showToasts: boolean;

  constructor(query: any, tableName: string, showToasts = false) {
    this.query = query;
    this.context = tableName;
    this.showToasts = showToasts;
  }

  eq(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.eq(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in eq operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.eq(${column})`);
    }
  }

  neq(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.neq(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in neq operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.neq(${column})`);
    }
  }

  in(column: string, values: any[]): RepositoryQuery<T> {
    try {
      this.query = this.query.in(column, values);
      return this;
    } catch (error) {
      logger.error(`Error in in operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.in(${column})`);
    }
  }

  ilike(column: string, pattern: string): RepositoryQuery<T> {
    try {
      this.query = this.query.ilike(column, pattern);
      return this;
    } catch (error) {
      logger.error(`Error in ilike operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.ilike(${column})`);
    }
  }

  is(column: string, isNull: null | boolean): RepositoryQuery<T> {
    try {
      this.query = this.query.is(column, isNull);
      return this;
    } catch (error) {
      logger.error(`Error in is operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.is(${column})`);
    }
  }

  /**
   * Filter by greater than
   */
  gt(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.gt(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in gt operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.gt(${column})`);
    }
  }

  /**
   * Filter by greater than or equal to
   */
  gte(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.gte(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in gte operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.gte(${column})`);
    }
  }

  /**
   * Filter by less than
   */
  lt(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.lt(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in lt operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.lt(${column})`);
    }
  }
  
  /**
   * Filter by less than or equal to
   */
  lte(column: string, value: any): RepositoryQuery<T> {
    try {
      this.query = this.query.lte(column, value);
      return this;
    } catch (error) {
      logger.error(`Error in lte operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.lte(${column})`);
    }
  }
  
  /**
   * Filter with OR conditions
   */
  or(filter: string): RepositoryQuery<T> {
    try {
      this.query = this.query.or(filter);
      return this;
    } catch (error) {
      logger.error(`Error in or operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.or(${filter})`);
    }
  }

  order(column: string, options: { ascending?: boolean } = {}): RepositoryQuery<T> {
    try {
      this.query = this.query.order(column, options);
      return this;
    } catch (error) {
      logger.error(`Error in order operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.order(${column})`);
    }
  }

  limit(count: number): RepositoryQuery<T> {
    try {
      this.query = this.query.limit(count);
      return this;
    } catch (error) {
      logger.error(`Error in limit operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.limit(${count})`);
    }
  }

  /**
   * Skip a number of results
   */
  offset(count: number): RepositoryQuery<T> {
    try {
      this.query = this.query.offset(count);
      return this;
    } catch (error) {
      logger.error(`Error in offset operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.offset(${count})`);
    }
  }

  range(from: number, to: number): RepositoryQuery<T> {
    try {
      this.query = this.query.range(from, to);
      return this;
    } catch (error) {
      logger.error(`Error in range operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.range(${from}, ${to})`);
    }
  }

  select(select = '*'): RepositoryQuery<T> {
    try {
      this.query = this.query.select(select);
      return this;
    } catch (error) {
      logger.error(`Error in select operation on ${this.context}:`, error);
      return new ErrorQuery<T>(error, `${this.context}.select(${select})`);
    }
  }

  async single(): Promise<RepositoryResponse<T>> {
    try {
      const { data, error } = await this.query.single();
      
      if (error) {
        return createErrorResponse<T>(handleRepositoryError(
          error, 
          `${this.context}.single()`
        ));
      }
      
      return createSuccessResponse<T>(data as T);
    } catch (error) {
      return createErrorResponse<T>(handleRepositoryError(
        error, 
        `${this.context}.single()`
      ));
    }
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    try {
      const { data, error } = await this.query.maybeSingle();
      
      if (error) {
        return createErrorResponse<T | null>(handleRepositoryError(
          error, 
          `${this.context}.maybeSingle()`
        ));
      }
      
      return createSuccessResponse<T | null>(data as T | null);
    } catch (error) {
      return createErrorResponse<T | null>(handleRepositoryError(
        error, 
        `${this.context}.maybeSingle()`
      ));
    }
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.query;
      
      if (error) {
        return createErrorResponse<T[]>(handleRepositoryError(
          error, 
          `${this.context}.execute()`
        ));
      }
      
      return createSuccessResponse<T[]>(data as T[] || []);
    } catch (error) {
      return createErrorResponse<T[]>(handleRepositoryError(
        error, 
        `${this.context}.execute()`
      ));
    }
  }
}

/**
 * Error Query class that always returns an error response
 * Used when an error occurs during query creation
 */
class ErrorQuery<T> implements RepositoryQuery<T> {
  private error: any;
  private context: string;

  constructor(error: any, context: string) {
    this.error = error;
    this.context = context;
  }

  // All chain methods just return this same error query
  eq(_column: string, _value: any): RepositoryQuery<T> { return this; }
  neq(_column: string, _value: any): RepositoryQuery<T> { return this; }
  in(_column: string, _values: any[]): RepositoryQuery<T> { return this; }
  ilike(_column: string, _pattern: string): RepositoryQuery<T> { return this; }
  is(_column: string, _isNull: null | boolean): RepositoryQuery<T> { return this; }
  gt(_column: string, _value: any): RepositoryQuery<T> { return this; }
  gte(_column: string, _value: any): RepositoryQuery<T> { return this; }
  lt(_column: string, _value: any): RepositoryQuery<T> { return this; }
  lte(_column: string, _value: any): RepositoryQuery<T> { return this; }
  or(_filter: string): RepositoryQuery<T> { return this; }
  order(_column: string, _options: { ascending?: boolean } = {}): RepositoryQuery<T> { return this; }
  limit(_count: number): RepositoryQuery<T> { return this; }
  offset(_count: number): RepositoryQuery<T> { return this; }
  range(_from: number, _to: number): RepositoryQuery<T> { return this; }
  select(_select?: string): RepositoryQuery<T> { return this; }

  // All execute methods return the error
  async single(): Promise<RepositoryResponse<T>> {
    return createErrorResponse<T>(handleRepositoryError(this.error, this.context));
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    return createErrorResponse<T | null>(handleRepositoryError(this.error, this.context));
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    return createErrorResponse<T[]>(handleRepositoryError(this.error, this.context));
  }
}

/**
 * Create a Supabase repository for a specific table
 */
export function createSupabaseRepository<T>(tableName: string, client?: any, schema: string = 'public'): SupabaseRepository<T> {
  return new SupabaseRepository<T>(tableName, client, schema);
}
