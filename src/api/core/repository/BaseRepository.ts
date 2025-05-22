
import { DataRepository, RepositoryQuery, RepositoryResponse } from './DataRepository';
import { logger } from '@/utils/logger';

/**
 * Base Repository Abstract Class
 * Implements common functionality for all repositories
 */
export abstract class BaseRepository<T = any> implements DataRepository<T> {
  tableName: string;
  protected options: Record<string, any> = {
    idField: 'id',
    defaultSelect: '*',
    softDelete: false,
    deletedAtColumn: 'deleted_at',
    enableLogging: false
  };

  constructor(tableName: string) {
    this.tableName = tableName;
    
    if (this.options.enableLogging) {
      logger.debug(`Created ${this.constructor.name} for table ${tableName}`);
    }
  }

  /**
   * Set repository options
   * @param options Repository configuration options
   */
  setOptions(options: Record<string, any>): void {
    this.options = { ...this.options, ...options };
    
    if (this.options.enableLogging) {
      logger.debug(`Set options for ${this.constructor.name}`, options);
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
        logger.debug(`${this.constructor.name}.getById(${id})`, {
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
        logger.debug(`${this.constructor.name}.getAll()`, {
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
   * Abstract methods to be implemented by specific repository implementations
   */
  abstract select(select?: string): RepositoryQuery<T>;
  abstract insert(data: Record<string, any> | Record<string, any>[]): RepositoryQuery<T>;
  abstract update(data: Record<string, any>): RepositoryQuery<T>;
  abstract delete(): RepositoryQuery<T>;

  /**
   * Standard error handling for repository operations
   * @param operation Name of the operation that failed
   * @param error The error that occurred
   * @param context Additional context for the error
   */
  protected handleError(operation: string, error: any, context: Record<string, any> = {}): void {
    logger.error(`${this.constructor.name}.${operation} error on table ${this.tableName}`, {
      error: error?.message || error,
      context,
      tableName: this.tableName
    });
  }

  /**
   * Monitor performance of a repository operation
   * @param operation Name of the operation to monitor
   * @param callback Function to execute and monitor
   * @returns The result of the callback function
   */
  protected async monitorPerformance<R>(operation: string, callback: () => Promise<R>): Promise<R> {
    const start = performance.now();
    try {
      const result = await callback();
      const duration = performance.now() - start;
      
      if (this.options.enableLogging) {
        logger.debug(`${this.constructor.name}.${operation} performance`, {
          duration: `${duration.toFixed(2)}ms`,
          table: this.tableName
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`${this.constructor.name}.${operation} failed after ${duration.toFixed(2)}ms`, {
        error: error?.message || error,
        table: this.tableName
      });
      throw error;
    }
  }
}
