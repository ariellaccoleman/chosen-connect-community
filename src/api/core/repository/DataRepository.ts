import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createSuccessResponse, createErrorResponse, ApiResponse, ApiError } from '../errorHandler';
import { logger } from '@/utils/logger';

/**
 * Data Repository Interface
 */
export interface DataRepository<T> {
  from(table: string): RepositoryQuery<T>;
  select(columns?: string): RepositoryQuery<T>;
  insert(values: Partial<T> | Partial<T>[]): RepositoryQuery<T>;
  update(values: Partial<T>): RepositoryQuery<T>;
  delete(): RepositoryQuery<T>;
}

/**
 * Query interface for repository operations
 */
export interface RepositoryQuery<T> {
  select(columns?: string): RepositoryQuery<T>;
  from(table: string): RepositoryQuery<T>;
  eq(column: string, value: any): RepositoryQuery<T>;
  neq(column: string, value: any): RepositoryQuery<T>;
  gt(column: string, value: any): RepositoryQuery<T>;
  gte(column: string, value: any): RepositoryQuery<T>; // Add the missing gte method
  lt(column: string, value: any): RepositoryQuery<T>;
  lte(column: string, value: any): RepositoryQuery<T>;
  like(column: string, pattern: string): RepositoryQuery<T>;
  ilike(column: string, pattern: string): RepositoryQuery<T>;
  in(column: string, values: any[]): RepositoryQuery<T>;
  is(column: string, value: any): RepositoryQuery<T>;
  or(filters: string, options?: Record<string, any>): RepositoryQuery<T>;
  and(filters: string, options?: Record<string, any>): RepositoryQuery<T>;
  order(column: string, options?: { ascending?: boolean }): RepositoryQuery<T>;
  limit(count: number): RepositoryQuery<T>;
  offset(count: number): RepositoryQuery<T>;
  range(from: number, to: number): RepositoryQuery<T>;
  single(): Promise<RepositoryResponse<T>>;
  maybeSingle(): Promise<RepositoryResponse<T | null>>;
  execute(): Promise<RepositoryResponse<T[]>>;
}

/**
 * Response format for repository operations
 */
export interface RepositoryResponse<T> {
  data: T | null;
  error: any | null;
  isSuccess(): boolean;
  isError(): boolean;
  getErrorMessage(): string | undefined;
}

/**
 * Supabase Data Repository Implementation
 */
export class SupabaseRepository<T> implements DataRepository<T> {
  private client: SupabaseClient<Database>;
  private tableName: string;

  constructor(client: SupabaseClient<Database>, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  from(tableName: string): SupabaseQuery<T> {
    return new SupabaseQuery<T>(this.client, tableName);
  }

  select(columns?: string): SupabaseQuery<T> {
    return new SupabaseQuery<T>(this.client, this.tableName).select(columns);
  }

  insert(values: Partial<T> | Partial<T>[]): SupabaseQuery<T> {
    return new SupabaseQuery<T>(this.client, this.tableName).insert(values);
  }

  update(values: Partial<T>): SupabaseQuery<T> {
    return new SupabaseQuery<T>(this.client, this.tableName).update(values);
  }

  delete(): SupabaseQuery<T> {
    return new SupabaseQuery<T>(this.client, this.tableName).delete();
  }
}

/**
 * Supabase Query Implementation
 */
class SupabaseQuery<T> implements RepositoryQuery<T> {
  private client: SupabaseClient<Database>;
  private queryBuilder: any; // Use 'any' to avoid complex type definitions

  constructor(client: SupabaseClient<Database>, tableName: string) {
    this.client = client;
    this.queryBuilder = client.from(tableName);
  }

  select(columns: string = '*'): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.select(columns);
    return this;
  }

  from(table: string): SupabaseQuery<T> {
    this.queryBuilder = this.client.from(table);
    return this;
  }

  eq(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.eq(column, value);
    return this;
  }

  neq(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.neq(column, value);
    return this;
  }

  gt(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.gt(column, value);
    return this;
  }

  gte(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.gte(column, value);
    return this;
  }

  lt(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.lt(column, value);
    return this;
  }

  lte(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.lte(column, value);
    return this;
  }

  like(column: string, pattern: string): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.ilike(column, pattern);
    return this;
  }

  in(column: string, values: any[]): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.in(column, values);
    return this;
  }

  is(column: string, value: any): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.is(column, value);
    return this;
  }

  or(filters: string, options?: Record<string, any>): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.or(filters, options);
    return this;
  }

  and(filters: string, options?: Record<string, any>): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.and(filters, options);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.order(column, options);
    return this;
  }

  limit(count: number): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.limit(count);
    return this;
  }

  offset(count: number): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.offset(count);
    return this;
  }

  range(from: number, to: number): SupabaseQuery<T> {
    this.queryBuilder = this.queryBuilder.range(from, to);
    return this;
  }

  async single(): Promise<RepositoryResponse<T>> {
    try {
      const { data, error } = await this.queryBuilder.single();

      if (error) {
        logger.error('SupabaseQuery: single() failed', { error });
        return createErrorResponse(error);
      }

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('SupabaseQuery: single() exception', { error });
      return createErrorResponse({ message: 'Failed to execute single query' } as ApiError);
    }
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    try {
      const { data, error } = await this.queryBuilder.maybeSingle();

      if (error) {
        logger.error('SupabaseQuery: maybeSingle() failed', { error });
        return createErrorResponse(error);
      }

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('SupabaseQuery: maybeSingle() exception', { error });
      return createErrorResponse({ message: 'Failed to execute maybeSingle query' } as ApiError);
    }
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error, count } = await this.queryBuilder;

      if (error) {
        logger.error('SupabaseQuery: execute() failed', { error });
        return createErrorResponse(error);
      }

      // If count is available, add it to the data object
      const responseData = count !== null ? { data, count } : data;

      return createSuccessResponse(responseData);
    } catch (error) {
      logger.error('SupabaseQuery: execute() exception', { error });
      return createErrorResponse({ message: 'Failed to execute query' } as ApiError);
    }
  }

  async insert(values: Partial<T> | Partial<T>[]): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.queryBuilder.insert(values).select();

      if (error) {
        logger.error('SupabaseQuery: insert() failed', { error });
        return createErrorResponse(error);
      }

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('SupabaseQuery: insert() exception', { error });
      return createErrorResponse({ message: 'Failed to execute insert query' } as ApiError);
    }
  }

  async update(values: Partial<T>): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.queryBuilder.update(values).select();

      if (error) {
        logger.error('SupabaseQuery: update() failed', { error });
        return createErrorResponse(error);
      }

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('SupabaseQuery: update() exception', { error });
      return createErrorResponse({ message: 'Failed to execute update query' } as ApiError);
    }
  }

  async delete(): Promise<RepositoryResponse<T[]>> {
    try {
      const { data, error } = await this.queryBuilder.delete().select();

      if (error) {
        logger.error('SupabaseQuery: delete() failed', { error });
        return createErrorResponse(error);
      }

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('SupabaseQuery: delete() exception', { error });
      return createErrorResponse({ message: 'Failed to execute delete query' } as ApiError);
    }
  }
}
