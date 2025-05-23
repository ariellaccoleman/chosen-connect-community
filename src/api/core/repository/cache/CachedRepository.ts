
import { BaseRepository } from '../BaseRepository';
import { DataRepository, RepositoryResponse } from '../DataRepository';
import { CacheOptions, CacheStrategy, DEFAULT_CACHE_OPTIONS } from './CacheConfig';
import { CacheStorage, createCacheStorage } from './CacheStorage';
import { logger } from '@/utils/logger';

/**
 * Repository decorator that adds caching capability
 */
export class CachedRepository<T> implements BaseRepository<T> {
  private cacheStorage: CacheStorage;
  private options: CacheOptions;
  readonly tableName: string;
  
  constructor(
    private repository: DataRepository<T>,
    options: Partial<CacheOptions> = {}
  ) {
    this.tableName = repository.tableName;
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    
    this.cacheStorage = createCacheStorage({
      persistent: this.options.persistent,
      namespace: this.tableName
    });
    
    // Log caching setup in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`CachedRepository created for ${this.tableName}`, {
        strategy: this.options.strategy,
        ttl: this.options.ttl,
        persistent: this.options.persistent
      });
    }
  }
  
  /**
   * Generate a cache key based on operation and arguments
   */
  private getCacheKey(operation: string, args: any[] = []): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(operation, args);
    }
    
    // Default key generation logic
    const argsString = args.length > 0 
      ? JSON.stringify(args).replace(/[{}[\]"']/g, '')
      : '';
    
    return `${this.tableName}:${operation}${argsString ? `:${argsString}` : ''}`;
  }
  
  /**
   * Execute operation with caching based on strategy
   */
  private async executeWithCache<R>(
    operation: string,
    repositoryMethod: () => Promise<RepositoryResponse<R>>,
    args: any[] = []
  ): Promise<RepositoryResponse<R>> {
    const cacheKey = this.getCacheKey(operation, args);
    
    // Fast path for no caching
    if (this.options.strategy === CacheStrategy.NONE) {
      return repositoryMethod();
    }
    
    // Cache-first strategy
    if (this.options.strategy === CacheStrategy.CACHE_FIRST) {
      const cachedResult = await this.cacheStorage.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult as RepositoryResponse<R>;
      }
    }
    
    // Network-first or stale-while-revalidate
    const networkResult = await repositoryMethod();
    
    // Don't cache errors
    if (!networkResult.isError()) {
      await this.cacheStorage.set(cacheKey, networkResult, this.options.ttl);
    }
    
    return networkResult;
  }
  
  /**
   * Clear cache entries related to an operation
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
  
  // Implement Base Repository operations with caching
  
  async select(columns?: string): Promise<DataRepository<T>> {
    return this.repository.select(columns);
  }
  
  async insert(data: Partial<T> | Partial<T>[]): Promise<RepositoryResponse<T>> {
    const result = await this.repository.insert(data);
    
    if (this.options.clearOnMutation && !result.isError()) {
      await this.invalidateCache();
    }
    
    return result;
  }
  
  async update(data: Partial<T>): Promise<RepositoryResponse<T>> {
    const result = await this.repository.update(data);
    
    if (this.options.clearOnMutation && !result.isError()) {
      await this.invalidateCache();
    }
    
    return result;
  }
  
  async delete(): Promise<RepositoryResponse<null>> {
    const result = await this.repository.delete();
    
    if (this.options.clearOnMutation && !result.isError()) {
      await this.invalidateCache();
    }
    
    return result;
  }
  
  async execute<R = T>(): Promise<RepositoryResponse<R>> {
    return this.executeWithCache<R>('execute', () => this.repository.execute<R>());
  }
  
  async executeBatch<R = T>(batch: any[]): Promise<RepositoryResponse<R>> {
    return this.executeWithCache<R>('executeBatch', () => 
      this.repository.executeBatch<R>(batch), [batch]);
  }
  
  // Query builder passthrough methods
  eq(column: string, value: any): DataRepository<T> {
    return this.repository.eq(column, value);
  }
  
  neq(column: string, value: any): DataRepository<T> {
    return this.repository.neq(column, value);
  }
  
  gt(column: string, value: any): DataRepository<T> {
    return this.repository.gt(column, value);
  }
  
  gte(column: string, value: any): DataRepository<T> {
    return this.repository.gte(column, value);
  }
  
  lt(column: string, value: any): DataRepository<T> {
    return this.repository.lt(column, value);
  }
  
  lte(column: string, value: any): DataRepository<T> {
    return this.repository.lte(column, value);
  }
  
  like(column: string, pattern: string): DataRepository<T> {
    return this.repository.like(column, pattern);
  }
  
  ilike(column: string, pattern: string): DataRepository<T> {
    return this.repository.ilike(column, pattern);
  }
  
  is(column: string, value: any): DataRepository<T> {
    return this.repository.is(column, value);
  }
  
  in(column: string, values: any[]): DataRepository<T> {
    return this.repository.in(column, values);
  }
  
  contains(column: string, value: any): DataRepository<T> {
    return this.repository.contains(column, value);
  }
  
  containedBy(column: string, value: any): DataRepository<T> {
    return this.repository.containedBy(column, value);
  }
  
  filter(column: string, operator: string, value: any): DataRepository<T> {
    return this.repository.filter(column, operator, value);
  }
  
  or(filters: string): DataRepository<T> {
    return this.repository.or(filters);
  }
  
  order(column: string, options?: { ascending?: boolean }): DataRepository<T> {
    return this.repository.order(column, options);
  }
  
  limit(count: number): DataRepository<T> {
    return this.repository.limit(count);
  }
  
  offset(count: number): DataRepository<T> {
    return this.repository.offset(count);
  }
  
  range(from: number, to: number): DataRepository<T> {
    return this.repository.range(from, to);
  }
  
  single(): Promise<RepositoryResponse<T>> {
    return this.executeWithCache<T>('single', () => this.repository.single());
  }
  
  maybeSingle(): Promise<RepositoryResponse<T | null>> {
    return this.executeWithCache<T | null>('maybeSingle', () => this.repository.maybeSingle());
  }

  setOptions(options: Record<string, any>): void {
    if (this.repository && typeof this.repository.setOptions === 'function') {
      this.repository.setOptions(options);
    }
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
