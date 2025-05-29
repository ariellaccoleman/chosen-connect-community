
import { ReadOnlyRepository, ReadOnlyRepositoryQuery, ReadOnlyRepositoryResponse, ReadOnlyRepositoryError } from './ReadOnlyRepository';
import { BaseRepository } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * View Repository Class
 * Extends BaseRepository but only implements read operations for database views
 * Throws errors if write operations are attempted
 */
export class ViewRepository<T = any> extends BaseRepository<T> implements ReadOnlyRepository<T> {
  protected client: any;
  protected schema: string;

  constructor(viewName: string, client?: any, schema: string = 'public') {
    super(viewName);
    this.client = client || supabase;
    this.schema = schema;
    
    if (this.options.enableLogging) {
      logger.debug(`Created ViewRepository for view ${viewName} with schema ${schema}`);
    }
  }

  /**
   * Select records from the view
   * @param select Fields to select
   * @returns Query builder that can be further chained
   */
  select(select: string = '*'): ViewRepositoryQuery<T> {
    return new ViewRepositoryQuery<T>(this.client, this.tableName, select, this.options);
  }

  /**
   * Insert operation - throws error for views
   */
  insert(data: Record<string, any> | Record<string, any>[]): never {
    throw new Error(`Insert operation not supported on view '${this.tableName}'`);
  }

  /**
   * Update operation - throws error for views
   */
  update(data: Record<string, any>): never {
    throw new Error(`Update operation not supported on view '${this.tableName}'`);
  }

  /**
   * Delete operation - throws error for views
   */
  delete(): never {
    throw new Error(`Delete operation not supported on view '${this.tableName}'`);
  }
}

/**
 * View Repository Query Class
 * Implements the read-only query interface for views
 */
class ViewRepositoryQuery<T> implements ReadOnlyRepositoryQuery<T> {
  private query: any;
  private options: Record<string, any>;

  constructor(client: any, viewName: string, select: string, options: Record<string, any>) {
    this.query = client.from(viewName).select(select);
    this.options = options;
  }

  eq(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.neq(column, value);
    return this;
  }

  in(column: string, values: any[]): ViewRepositoryQuery<T> {
    this.query = this.query.in(column, values);
    return this;
  }

  ilike(column: string, pattern: string): ViewRepositoryQuery<T> {
    this.query = this.query.ilike(column, pattern);
    return this;
  }

  is(column: string, isNull: null | boolean): ViewRepositoryQuery<T> {
    this.query = this.query.is(column, isNull);
    return this;
  }

  gt(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.gt(column, value);
    return this;
  }

  gte(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.gte(column, value);
    return this;
  }

  lt(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.lt(column, value);
    return this;
  }

  lte(column: string, value: any): ViewRepositoryQuery<T> {
    this.query = this.query.lte(column, value);
    return this;
  }

  or(filter: string): ViewRepositoryQuery<T> {
    this.query = this.query.or(filter);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): ViewRepositoryQuery<T> {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number): ViewRepositoryQuery<T> {
    this.query = this.query.limit(count);
    return this;
  }

  offset(count: number): ViewRepositoryQuery<T> {
    this.query = this.query.range(count, count + 1000); // Use range for offset
    return this;
  }

  range(from: number, to: number): ViewRepositoryQuery<T> {
    this.query = this.query.range(from, to);
    return this;
  }

  select(select?: string, options?: { count?: boolean }): ViewRepositoryQuery<T> {
    if (select) {
      this.query = this.query.select(select, options);
    }
    return this;
  }

  async single(): Promise<ReadOnlyRepositoryResponse<T>> {
    try {
      const result = await this.query.single();
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async maybeSingle(): Promise<ReadOnlyRepositoryResponse<T | null>> {
    try {
      const result = await this.query.maybeSingle();
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async execute(): Promise<ReadOnlyRepositoryResponse<T[]>> {
    try {
      const result = await this.query;
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
