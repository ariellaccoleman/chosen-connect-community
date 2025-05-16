
import { supabase } from '@/integrations/supabase/client';
import { DataRepository, RepositoryQuery, RepositoryResponse, RepositoryError } from './DataRepository';
import { logger } from '@/utils/logger';
import { toast } from "@/components/ui/sonner";

/**
 * Create standardized repository response
 */
function createSuccessResponse<T>(data: T): RepositoryResponse<T> {
  return {
    data,
    error: null,
    status: 'success',
    isSuccess: () => true,
    isError: () => false,
    getErrorMessage: () => '',
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse<T>(error: any): RepositoryResponse<T> {
  // Format the error to match our expected structure
  const repositoryError: RepositoryError = {
    code: error?.code || 'repository_error',
    message: error?.message || 'An unknown error occurred',
    details: error?.details || null,
    original: error
  };
  
  return {
    data: null,
    error: repositoryError,
    status: 'error',
    isSuccess: () => false,
    isError: () => true,
    getErrorMessage: () => repositoryError.message,
  };
}

/**
 * Handle repository errors consistently
 */
function handleRepositoryError(error: any, context: string, showToast = false): RepositoryError {
  // Log the error with context
  logger.error(`Repository Error (${context}):`, error);
  
  // Show toast if enabled
  if (showToast && error?.message) {
    toast.error(`Error: ${error.message}`);
  }
  
  // Return standardized error object
  const repositoryError: RepositoryError = {
    code: error?.code || 'unknown_error',
    message: error?.message || 'An unknown error occurred',
    details: error?.details || {},
    original: error
  };
  
  return repositoryError;
}

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
    try {
      const query = supabase
        .from(this.tableName as any)
        .select(selectQuery);
      
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
  insert(data: any): RepositoryQuery<T> {
    try {
      const query = supabase
        .from(this.tableName as any)
        .insert(data);
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating insert query for ${this.tableName}:`, error);
      return new ErrorQuery<T>(error, `insert into ${this.tableName}`);
    }
  }

  /**
   * Create an update query
   */
  update(data: any): RepositoryQuery<T> {
    try {
      const query = supabase
        .from(this.tableName as any)
        .update(data);
      
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
      const query = supabase
        .from(this.tableName as any)
        .delete();
      
      return new SupabaseQuery<T>(query, this.tableName);
    } catch (error) {
      logger.error(`Error creating delete query for ${this.tableName}:`, error);
      return new ErrorQuery<T>(error, `delete from ${this.tableName}`);
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
        const repositoryError = handleRepositoryError(
          error, 
          `${this.context}.single()`, 
          this.showToasts
        );
        return createErrorResponse<T>(repositoryError);
      }
      
      return createSuccessResponse<T>(data as T);
    } catch (error) {
      const repositoryError = handleRepositoryError(
        error, 
        `${this.context}.single()`, 
        this.showToasts
      );
      return createErrorResponse<T>(repositoryError);
    }
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    try {
      const { data, error } = await this.query.maybeSingle();
      
      if (error) {
        const repositoryError = handleRepositoryError(
          error, 
          `${this.context}.maybeSingle()`, 
          this.showToasts
        );
        return createErrorResponse<T | null>(repositoryError);
      }
      
      return createSuccessResponse<T | null>(data as T | null);
    } catch (error) {
      const repositoryError = handleRepositoryError(
        error, 
        `${this.context}.maybeSingle()`, 
        this.showToasts
      );
      return createErrorResponse<T | null>(repositoryError);
    }
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.query;
      
      if (error) {
        const repositoryError = handleRepositoryError(
          error, 
          `${this.context}.execute()`, 
          this.showToasts
        );
        return createErrorResponse<T[]>(repositoryError);
      }
      
      return createSuccessResponse<T[]>(data as T[] || []);
    } catch (error) {
      const repositoryError = handleRepositoryError(
        error, 
        `${this.context}.execute()`, 
        this.showToasts
      );
      return createErrorResponse<T[]>(repositoryError);
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
  order(_column: string, _options: { ascending?: boolean } = {}): RepositoryQuery<T> { return this; }
  limit(_count: number): RepositoryQuery<T> { return this; }
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
export function createSupabaseRepository<T>(tableName: string): DataRepository<T> {
  return new SupabaseRepository<T>(tableName);
}

/**
 * Create a Supabase repository with toast notifications enabled
 */
export function createSupabaseRepositoryWithToasts<T>(tableName: string): DataRepository<T> {
  return new SupabaseRepository<T>(tableName);
}
