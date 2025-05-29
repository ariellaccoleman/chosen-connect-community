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

  constructor(viewName: string, client?: any, schema: string = 'public') {
    this.tableName = viewName;
    this.client = client || supabase;
    this.schema = schema;
    
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
   * Get a record by ID
   * @param id ID of the record to retrieve
   * @returns Promise with the record or null if not found
   */
  async getById(id: string | number): Promise<T | null> {
    try {
      const result = await this.select()
        .eq(this.options.idField, id)
        .maybeSingle();
      
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
    try {
      const result = await this.select().execute();
      
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
 * Now handles client queries more robustly like the client-aware wrapper
 */
class ViewRepositoryQuery<T> implements ReadOnlyRepositoryQuery<T> {
  private baseQuery: any;
  private options: Record<string, any>;
  private tableName: string;
  private client: any;

  constructor(client: any, viewName: string, select: string, options: Record<string, any>) {
    this.client = client;
    this.tableName = viewName;
    this.options = options;
    
    // Initialize the base query - handle potential undefined gracefully
    try {
      this.baseQuery = client.from(viewName).select(select);
    } catch (error) {
      // If client.from fails, create a fallback that will handle errors gracefully
      this.baseQuery = null;
    }
  }

  private createSafeQuery(): any {
    // If we don't have a base query, create a safe wrapper that handles method calls
    if (!this.baseQuery) {
      return this.createFailsafeQueryWrapper();
    }
    return this.baseQuery;
  }

  private createFailsafeQueryWrapper(): any {
    const self = this;
    return {
      eq: (column: string, value: any) => {
        try {
          const query = self.client.from(self.tableName).select().eq(column, value);
          return self.createQueryWrapper(query);
        } catch (error) {
          return self.createFailsafeQueryWrapper();
        }
      },
      neq: (column: string, value: any) => {
        try {
          const query = self.client.from(self.tableName).select().neq(column, value);
          return self.createQueryWrapper(query);
        } catch (error) {
          return self.createFailsafeQueryWrapper();
        }
      },
      in: (column: string, values: any[]) => {
        try {
          const query = self.client.from(self.tableName).select().in(column, values);
          return self.createQueryWrapper(query);
        } catch (error) {
          return self.createFailsafeQueryWrapper();
        }
      },
      // ... similar patterns for other methods
      execute: () => self.createErrorResponse(new Error('Query execution failed - client not available')),
      single: () => self.createErrorResponse(new Error('Query execution failed - client not available')),
      maybeSingle: () => self.createErrorResponse(new Error('Query execution failed - client not available'))
    };
  }

  private createQueryWrapper(query: any): any {
    const self = this;
    return {
      eq: (column: string, value: any) => {
        const newQuery = query.eq(column, value);
        return self.createQueryWrapper(newQuery);
      },
      neq: (column: string, value: any) => {
        const newQuery = query.neq(column, value);
        return self.createQueryWrapper(newQuery);
      },
      in: (column: string, values: any[]) => {
        const newQuery = query.in(column, values);
        return self.createQueryWrapper(newQuery);
      },
      ilike: (column: string, pattern: string) => {
        const newQuery = query.ilike(column, pattern);
        return self.createQueryWrapper(newQuery);
      },
      is: (column: string, isNull: null | boolean) => {
        const newQuery = query.is(column, isNull);
        return self.createQueryWrapper(newQuery);
      },
      gt: (column: string, value: any) => {
        const newQuery = query.gt(column, value);
        return self.createQueryWrapper(newQuery);
      },
      gte: (column: string, value: any) => {
        const newQuery = query.gte(column, value);
        return self.createQueryWrapper(newQuery);
      },
      lt: (column: string, value: any) => {
        const newQuery = query.lt(column, value);
        return self.createQueryWrapper(newQuery);
      },
      lte: (column: string, value: any) => {
        const newQuery = query.lte(column, value);
        return self.createQueryWrapper(newQuery);
      },
      or: (filter: string) => {
        const newQuery = query.or(filter);
        return self.createQueryWrapper(newQuery);
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        const newQuery = query.order(column, options);
        return self.createQueryWrapper(newQuery);
      },
      limit: (count: number) => {
        const newQuery = query.limit(count);
        return self.createQueryWrapper(newQuery);
      },
      offset: (count: number) => {
        const newQuery = query.range(count, count + 1000);
        return self.createQueryWrapper(newQuery);
      },
      range: (from: number, to: number) => {
        const newQuery = query.range(from, to);
        return self.createQueryWrapper(newQuery);
      },
      select: (select?: string, options?: { count?: boolean }) => {
        if (select) {
          const newQuery = query.select(select, options);
          return self.createQueryWrapper(newQuery);
        }
        return self.createQueryWrapper(query);
      },
      execute: () => self.executeQuery(query),
      single: () => self.executeQuerySingle(query),
      maybeSingle: () => self.executeQueryMaybeSingle(query)
    };
  }

  eq(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.eq) {
      this.baseQuery = query.eq(column, value);
    }
    return this;
  }

  neq(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.neq) {
      this.baseQuery = query.neq(column, value);
    }
    return this;
  }

  in(column: string, values: any[]): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.in) {
      this.baseQuery = query.in(column, values);
    }
    return this;
  }

  ilike(column: string, pattern: string): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.ilike) {
      this.baseQuery = query.ilike(column, pattern);
    }
    return this;
  }

  is(column: string, isNull: null | boolean): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.is) {
      this.baseQuery = query.is(column, isNull);
    }
    return this;
  }

  gt(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.gt) {
      this.baseQuery = query.gt(column, value);
    }
    return this;
  }

  gte(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.gte) {
      this.baseQuery = query.gte(column, value);
    }
    return this;
  }

  lt(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.lt) {
      this.baseQuery = query.lt(column, value);
    }
    return this;
  }

  lte(column: string, value: any): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.lte) {
      this.baseQuery = query.lte(column, value);
    }
    return this;
  }

  or(filter: string): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.or) {
      this.baseQuery = query.or(filter);
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.order) {
      this.baseQuery = query.order(column, options);
    }
    return this;
  }

  limit(count: number): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.limit) {
      this.baseQuery = query.limit(count);
    }
    return this;
  }

  offset(count: number): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.range) {
      this.baseQuery = query.range(count, count + 1000);
    }
    return this;
  }

  range(from: number, to: number): ViewRepositoryQuery<T> {
    const query = this.createSafeQuery();
    if (query.range) {
      this.baseQuery = query.range(from, to);
    }
    return this;
  }

  select(select?: string, options?: { count?: boolean }): ViewRepositoryQuery<T> {
    if (select) {
      const query = this.createSafeQuery();
      if (query.select) {
        this.baseQuery = query.select(select, options);
      }
    }
    return this;
  }

  async single(): Promise<ReadOnlyRepositoryResponse<T>> {
    return this.executeQuerySingle(this.baseQuery);
  }

  async maybeSingle(): Promise<ReadOnlyRepositoryResponse<T | null>> {
    return this.executeQueryMaybeSingle(this.baseQuery);
  }

  async execute(): Promise<ReadOnlyRepositoryResponse<T[]>> {
    return this.executeQuery(this.baseQuery);
  }

  private async executeQuery(query: any): Promise<ReadOnlyRepositoryResponse<T[]>> {
    try {
      if (!query) {
        return this.createErrorResponse(new Error('Query not available'));
      }
      const result = await query;
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  private async executeQuerySingle(query: any): Promise<ReadOnlyRepositoryResponse<T>> {
    try {
      if (!query) {
        return this.createErrorResponse(new Error('Query not available'));
      }
      const result = await query.single();
      return this.createResponse(result.data, result.error);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  private async executeQueryMaybeSingle(query: any): Promise<ReadOnlyRepositoryResponse<T | null>> {
    try {
      if (!query) {
        return this.createErrorResponse(new Error('Query not available'));
      }
      const result = await query.maybeSingle();
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
