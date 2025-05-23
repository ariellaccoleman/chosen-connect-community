
import { BaseRepository } from '../BaseRepository';
import { DataRepository, RepositoryQuery, RepositoryResponse } from '../DataRepository';
import { CacheOptions, CacheStrategy, DEFAULT_CACHE_OPTIONS } from './CacheConfig';
import { CacheStorage, createCacheStorage } from './CacheStorage';
import { logger } from '@/utils/logger';

/**
 * Repository decorator that adds caching capability
 */
export class CachedRepository<T> extends BaseRepository<T> {
  private cacheStorage: CacheStorage;
  private cacheOptions: CacheOptions;
  private repository: DataRepository<T>;
  
  constructor(
    repository: DataRepository<T>,
    options: Partial<CacheOptions> = {}
  ) {
    super(repository.tableName);
    this.repository = repository;
    this.cacheOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };
    
    this.cacheStorage = createCacheStorage({
      persistent: this.cacheOptions.persistent,
      namespace: this.tableName
    });
    
    // Log caching setup in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`CachedRepository created for ${this.tableName}`, {
        strategy: this.cacheOptions.strategy,
        ttl: this.cacheOptions.ttl,
        persistent: this.cacheOptions.persistent
      });
    }
  }
  
  /**
   * Generate a cache key based on operation and arguments
   */
  private getCacheKey(operation: string, args: any[] = []): string {
    if (this.cacheOptions.keyGenerator) {
      return this.cacheOptions.keyGenerator(operation, args);
    }
    
    // Default key generation logic
    const argsString = args.length > 0 
      ? JSON.stringify(args).replace(/[{}[\]"']/g, '')
      : '';
    
    return `${this.tableName}:${operation}${argsString ? `:${argsString}` : ''}`;
  }
  
  /**
   * Process operations through cache based on strategy
   */
  private async withCaching<R>(
    operation: string,
    action: () => Promise<R>,
    args: any[] = []
  ): Promise<R> {
    const cacheKey = this.getCacheKey(operation, args);
    
    // Fast path for no caching
    if (this.cacheOptions.strategy === CacheStrategy.NONE) {
      return action();
    }
    
    // Check cache first for cache-first and stale-while-revalidate strategies
    if (this.cacheOptions.strategy === CacheStrategy.CACHE_FIRST || 
        this.cacheOptions.strategy === CacheStrategy.STALE_WHILE_REVALIDATE) {
      const cachedResult = await this.cacheStorage.get(cacheKey);
      if (cachedResult !== null) {
        // For stale-while-revalidate, refresh cache in background
        if (this.cacheOptions.strategy === CacheStrategy.STALE_WHILE_REVALIDATE) {
          this.refreshCache(operation, action, cacheKey);
        }
        return cachedResult;
      }
    }
    
    // If we get here, we need to fetch from network
    const result = await action();
    
    // Cache the result
    await this.cacheStorage.set(cacheKey, result, this.cacheOptions.ttl);
    
    return result;
  }
  
  /**
   * Refresh cache in background without blocking
   */
  private async refreshCache<R>(
    operation: string, 
    action: () => Promise<R>,
    cacheKey: string
  ): Promise<void> {
    try {
      const freshResult = await action();
      await this.cacheStorage.set(cacheKey, freshResult, this.cacheOptions.ttl);
      logger.debug(`Refreshed cache for ${operation} in background`);
    } catch (error) {
      logger.error(`Failed to refresh cache for ${operation}`, error);
      // Don't throw, this is a background operation
    }
  }
  
  /**
   * Clear cache entries when mutations occur
   */
  private async invalidateCache(operation?: string): Promise<void> {
    if (!operation) {
      // Clear all cache if no specific operation
      await this.cacheStorage.clear();
      return;
    }
    
    // Clear pattern for specific operation
    const pattern = `${this.tableName}:${operation}`;
    await this.cacheStorage.clearPattern(pattern);
  }
  
  // BaseRepository implementation methods
  async getById(id: string | number): Promise<T | null> {
    return this.withCaching('getById', () => this.repository.getById(id), [id]);
  }
  
  async getAll(): Promise<T[]> {
    return this.withCaching('getAll', () => this.repository.getAll(), []);
  }
  
  select(select?: string): RepositoryQuery<T> {
    return new CachedRepositoryQuery<T>(
      this.repository.select(select),
      this.cacheStorage,
      this.cacheOptions,
      'select',
      [select],
      this.tableName
    );
  }
  
  insert(data: Record<string, any> | Record<string, any>[]): RepositoryQuery<T> {
    const query = this.repository.insert(data);
    
    if (this.cacheOptions.clearOnMutation) {
      this.invalidateCache();
    }
    
    return query;
  }
  
  update(data: Record<string, any>): RepositoryQuery<T> {
    const query = this.repository.update(data);
    
    if (this.cacheOptions.clearOnMutation) {
      this.invalidateCache();
    }
    
    return query;
  }
  
  delete(): RepositoryQuery<T> {
    const query = this.repository.delete();
    
    if (this.cacheOptions.clearOnMutation) {
      this.invalidateCache();
    }
    
    return query;
  }
  
  setOptions(options: Record<string, any>): void {
    if (typeof options === 'object') {
      this.cacheOptions = { ...this.cacheOptions, ...options };
    }
    
    if (this.repository && typeof this.repository.setOptions === 'function') {
      this.repository.setOptions(options);
    }
  }

  /**
   * Implementation of BaseRepository methods for error handling
   */
  protected handleError(operation: string, error: any, context: Record<string, any> = {}): void {
    logger.error(`CachedRepository.${operation} error on table ${this.tableName}`, {
      error: error?.message || error,
      context,
      tableName: this.tableName,
      cacheStrategy: this.cacheOptions.strategy
    });
  }

  /**
   * Implementation of BaseRepository methods for performance monitoring
   */
  protected async monitorPerformance<R>(operation: string, callback: () => Promise<R>): Promise<R> {
    const start = performance.now();
    try {
      const result = await callback();
      const duration = performance.now() - start;
      
      if (this.options && this.options.enableLogging) {
        logger.debug(`CachedRepository.${operation} performance`, {
          duration: `${duration.toFixed(2)}ms`,
          table: this.tableName,
          cacheStrategy: this.cacheOptions.strategy
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`CachedRepository.${operation} failed after ${duration.toFixed(2)}ms`, {
        error: error?.message || error,
        table: this.tableName,
        cacheStrategy: this.cacheOptions.strategy
      });
      throw error;
    }
  }
}

/**
 * Query decorator that adds caching to repository queries
 */
class CachedRepositoryQuery<T> implements RepositoryQuery<T> {
  private query: RepositoryQuery<T>;
  private cacheStorage: CacheStorage;
  private options: CacheOptions;
  private operation: string;
  private args: any[] = [];
  private tableName: string;

  constructor(
    query: RepositoryQuery<T>,
    cacheStorage: CacheStorage,
    options: CacheOptions,
    operation: string,
    args: any[] = [],
    tableName: string
  ) {
    this.query = query;
    this.cacheStorage = cacheStorage;
    this.options = options;
    this.operation = operation;
    this.args = args;
    this.tableName = tableName;
  }
  
  /**
   * Generate a cache key based on operation and arguments
   */
  private getCacheKey(): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(this.operation, this.args);
    }
    
    // Default key generation logic
    const argsString = this.args.length > 0 
      ? JSON.stringify(this.args).replace(/[{}[\]"']/g, '')
      : '';
    
    return `${this.tableName}:${this.operation}${argsString ? `:${argsString}` : ''}`;
  }
  
  /**
   * Execute with caching when terminal operations are called
   */
  private async withQueryCaching<R>(
    method: string,
    action: () => Promise<R>
  ): Promise<R> {
    // Fast path for no caching
    if (this.options.strategy === CacheStrategy.NONE) {
      return action();
    }
    
    const cacheKey = `${this.getCacheKey()}:${method}`;
    
    // Cache-first: return cached value if exists
    if (this.options.strategy === CacheStrategy.CACHE_FIRST) {
      const cachedResult = await this.cacheStorage.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }
    
    // Stale-while-revalidate: return cached value if exists and refresh in background
    if (this.options.strategy === CacheStrategy.STALE_WHILE_REVALIDATE) {
      const cachedResult = await this.cacheStorage.get(cacheKey);
      if (cachedResult !== null) {
        // Update cache in the background
        this.refreshCache(action, cacheKey);
        return cachedResult;
      }
    }
    
    // If we get here, we need to fetch from source
    const result = await action();
    
    // Cache the result
    await this.cacheStorage.set(cacheKey, result, this.options.ttl);
    
    return result;
  }
  
  /**
   * Refresh cache in background
   */
  private async refreshCache<R>(
    action: () => Promise<R>,
    cacheKey: string
  ): Promise<void> {
    try {
      const freshResult = await action();
      await this.cacheStorage.set(cacheKey, freshResult, this.options.ttl);
    } catch (error) {
      logger.error('Error refreshing cache', error);
      // Don't throw, this is a background operation
    }
  }
  
  // Terminal operations with caching
  
  async execute<R = T[]>(): Promise<RepositoryResponse<R>> {
    return this.withQueryCaching('execute', () => this.query.execute()) as Promise<RepositoryResponse<R>>;
  }
  
  async single(): Promise<RepositoryResponse<T>> {
    return this.withQueryCaching('single', () => this.query.single());
  }
  
  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    return this.withQueryCaching('maybeSingle', () => this.query.maybeSingle());
  }
  
  // Query builder methods - pass through to underlying query
  
  eq(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ eq: { column, value } });
    this.query.eq(column, value);
    return this;
  }
  
  neq(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ neq: { column, value } });
    this.query.neq(column, value);
    return this;
  }
  
  gt(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ gt: { column, value } });
    this.query.gt(column, value);
    return this;
  }
  
  gte(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ gte: { column, value } });
    this.query.gte(column, value);
    return this;
  }
  
  lt(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ lt: { column, value } });
    this.query.lt(column, value);
    return this;
  }
  
  lte(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ lte: { column, value } });
    this.query.lte(column, value);
    return this;
  }
  
  ilike(column: string, pattern: string): RepositoryQuery<T> {
    this.args.push({ ilike: { column, pattern } });
    this.query.ilike(column, pattern);
    return this;
  }
  
  is(column: string, value: any): RepositoryQuery<T> {
    this.args.push({ is: { column, value } });
    this.query.is(column, value);
    return this;
  }
  
  in(column: string, values: any[]): RepositoryQuery<T> {
    this.args.push({ in: { column, values } });
    this.query.in(column, values);
    return this;
  }
  
  order(column: string, options?: { ascending?: boolean }): RepositoryQuery<T> {
    this.args.push({ order: { column, options } });
    this.query.order(column, options);
    return this;
  }
  
  limit(count: number): RepositoryQuery<T> {
    this.args.push({ limit: count });
    this.query.limit(count);
    return this;
  }
  
  range(from: number, to: number): RepositoryQuery<T> {
    this.args.push({ range: { from, to } });
    this.query.range(from, to);
    return this;
  }
  
  select(select?: string, options?: { count?: boolean }): RepositoryQuery<T> {
    this.args.push({ select, options });
    this.query.select(select, options);
    return this;
  }
  
  // These methods were missing in the original implementation, causing TypeScript errors
  
  or(filters: string): RepositoryQuery<T> {
    this.args.push({ or: filters });
    this.query.or(filters);
    return this;
  }
  
  offset(count: number): RepositoryQuery<T> {
    this.args.push({ offset: count });
    this.query.offset(count);
    return this;
  }
}

/**
 * Create a cached repository decorator
 */
export function createCachedRepository<T>(
  baseRepository: DataRepository<T>, 
  options: Partial<CacheOptions> = {}
): CachedRepository<T> {
  return new CachedRepository<T>(baseRepository, options);
}
