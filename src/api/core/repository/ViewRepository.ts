
import { ReadOnlyRepository, ReadOnlyRepositoryQuery, ReadOnlyRepositoryResponse, ReadOnlyRepositoryError } from './ReadOnlyRepository';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * View Repository Class
 * Implements ReadOnlyRepository interface for database views
 * Throws errors if write operations are attempted
 * Does NOT extend BaseRepository to avoid inheriting write operations
 */
export class ViewRepository<T = any> implements ReadOnlyRepository<T> {
  tableName: string;
  protected client: any;
  protected schema: string;
  protected options: Record<string, any> = {
    idField: 'id',
    defaultSelect: '*',
    enableLogging: false
  };
  private clientValidated: boolean = false;

  constructor(viewName: string, client?: any, schema: string = 'public') {
    this.tableName = viewName;
    this.client = client || supabase;
    this.schema = schema;
    
    // Lightweight constructor - no client testing during instantiation
    if (this.options.enableLogging) {
      logger.debug(`Created ViewRepository for view ${viewName} with schema ${schema}`);
    }
  }

  /**
   * Set repository options
   * @param options Repository configuration options
   */
  setOptions(options: Record<string, any>): void {
    this.options = { ...this.options, ...options };
    
    if (this.options.enableLogging) {
      logger.debug(`Set options for ViewRepository ${this.tableName}`, options);
    }
  }

  /**
   * Lazy client validation - called before first database operation
   * @private
   */
  private ensureClientReady(): void {
    if (this.clientValidated) {
      return;
    }

    if (!this.client) {
      throw new Error(`Client not available for view ${this.tableName}`);
    }

    if (!this.client.from || typeof this.client.from !== 'function') {
      throw new Error(`Client does not have 'from' method for view ${this.tableName}`);
    }

    this.clientValidated = true;
  }

  /**
   * Get a record by ID
   * @param id ID of the record to retrieve
   * @returns Promise with the record or null if not found
   */
  async getById(id: string | number): Promise<T | null> {
    this.ensureClientReady();
    
    try {
      const query = this.select();
      const eqQuery = query.eq(this.options.idField, id);
      const result = await eqQuery.maybeSingle();
      
      if (this.options.enableLogging) {
        logger.debug(`ViewRepository.getById(${id})`, {
          result: result.isSuccess() ? 'success' : 'error',
          error: result.error
        });
      }
      
      return result.data as T | null;
    } catch (error) {
      this.handleError('getById', error, { id });
      return null;
    }
  }

  /**
   * Get all records
   * @returns Promise with an array of records
   */
  async getAll(): Promise<T[]> {
    this.ensureClientReady();
    
    try {
      const query = this.select();
      const result = await query.execute();
      
      if (this.options.enableLogging) {
        logger.debug(`ViewRepository.getAll()`, {
          result: result.isSuccess() ? 'success' : 'error',
          count: result.data?.length || 0,
          error: result.error
        });
      }
      
      return result.data as T[] || [];
    } catch (error) {
      this.handleError('getAll', error);
      return [];
    }
  }

  /**
   * Select records from the view
   * @param select Fields to select
   * @returns Query builder that can be further chained
   */
  select(select: string = '*'): ViewRepositoryQuery<T> {
    this.ensureClientReady();
    return new ViewRepositoryQuery<T>(this.client, this.tableName, select, this.options);
  }

  /**
   * Standard error handling for repository operations
   * @param operation Name of the operation that failed
   * @param error The error that occurred
   * @param context Additional context for the error
   */
  protected handleError(operation: string, error: any, context: Record<string, any> = {}): void {
    logger.error(`ViewRepository.${operation} error on view ${this.tableName}`, {
      error: error?.message || error,
      context,
      tableName: this.tableName
    });
  }
}

/**
 * View Repository Query Class
 * Implements the read-only query interface for views
 * Uses lazy query building to avoid early client testing
 */
class ViewRepositoryQuery<T> implements ReadOnlyRepositoryQuery<T> {
  private client: any;
  private tableName: string;
  private selectFields: string;
  private options: Record<string, any>;
  private queryChain: any[] = [];

  constructor(client: any, viewName: string, select: string, options: Record<string, any>) {
    this.client = client;
    this.tableName = viewName;
    this.selectFields = select;
    this.options = options;
    // No immediate query building - defer until execution
  }

  /**
   * Build the actual query chain when needed
   * @private
   */
  private buildQuery(): any {
    let query = this.client.from(this.tableName).select(this.selectFields);
    
    // Apply all chained operations
    for (const operation of this.queryChain) {
      query = operation(query);
    }
    
    return query;
  }

  /**
   * Add an operation to the query chain
   * @private
   */
  private addOperation(operation: (query: any) => any): ViewRepositoryQuery<T> {
    this.queryChain.push(operation);
    return this;
  }

  eq(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.eq(column, value));
  }

  neq(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.neq(column, value));
  }

  in(column: string, values: any[]): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.in(column, values));
  }

  ilike(column: string, pattern: string): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.ilike(column, pattern));
  }

  is(column: string, isNull: null | boolean): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.is(column, isNull));
  }

  gt(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.gt(column, value));
  }

  gte(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.gte(column, value));
  }

  lt(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.lt(column, value));
  }

  lte(column: string, value: any): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.lte(column, value));
  }

  or(filter: string): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.or(filter));
  }

  order(column: string, options?: { ascending?: boolean }): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.order(column, options));
  }

  limit(count: number): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.limit(count));
  }

  offset(count: number): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.range(count, count + 1000));
  }

  range(from: number, to: number): ViewRepositoryQuery<T> {
    return this.addOperation(query => query.range(from, to));
  }

  select(select?: string, options?: { count?: boolean }): ViewRepositoryQuery<T> {
    if (select) {
      this.selectFields = select;
    }
    return this;
  }

  async single(): Promise<ReadOnlyRepositoryResponse<T>> {
    try {
      const query = this.buildQuery();
      const result = await query.single();
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async maybeSingle(): Promise<ReadOnlyRepositoryResponse<T | null>> {
    try {
      const query = this.buildQuery();
      const result = await query.maybeSingle();
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async execute(): Promise<ReadOnlyRepositoryResponse<T[]>> {
    try {
      const query = this.buildQuery();
      const result = await query;
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  private createResponse<R>(data: R, error: any): ReadOnlyRepositoryResponse<R> {
    return {
      data: error ? null : data,
      error: error ? this.mapError(error) : null,
      isSuccess: () => !error,
      isError: () => !!error,
      getErrorMessage: () => error ? error.message || 'Unknown error' : ''
    };
  }

  private createErrorResponse<R>(error: any): ReadOnlyRepositoryResponse<R> {
    return {
      data: null,
      error: this.mapError(error),
      isSuccess: () => false,
      isError: () => true,
      getErrorMessage: () => error?.message || 'Unknown error'
    };
  }

  private mapError(error: any): ReadOnlyRepositoryError {
    return {
      code: error?.code || 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error?.details,
      original: error
    };
  }
}

/**
 * Factory function to create view repositories
 */
export function createViewRepository<T>(
  viewName: string,
  client?: any,
  schema: string = 'public'
): ViewRepository<T> {
  return new ViewRepository<T>(viewName, client, schema);
}
