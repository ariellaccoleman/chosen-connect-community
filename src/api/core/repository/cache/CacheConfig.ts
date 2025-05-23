
/**
 * Cache configuration types for repository caching
 */

/**
 * Cache strategy options
 */
export enum CacheStrategy {
  /**
   * No caching - always fetch from the data source
   */
  NONE = 'none',
  
  /**
   * Cache result until invalidated explicitly
   */
  CACHE_FIRST = 'cache_first',
  
  /**
   * Check cache first, then network, update cache with new data
   */
  STALE_WHILE_REVALIDATE = 'stale_while_revalidate',
  
  /**
   * Always fetch from network but update cache
   */
  NETWORK_FIRST = 'network_first'
}

/**
 * Configuration options for cache behavior
 */
export interface CacheOptions {
  /**
   * Cache strategy to use
   */
  strategy: CacheStrategy;
  
  /**
   * TTL in seconds for cached items
   * Set to 0 for no expiration
   */
  ttl?: number;
  
  /**
   * Whether to automatically clear cache after mutation operations
   */
  clearOnMutation?: boolean;
  
  /**
   * Whether to use browser storage (localStorage) as a persistence layer
   * If false, cache is in-memory only
   */
  persistent?: boolean;
  
  /**
   * Custom key generator function for cache entries
   * By default uses operation + args as key
   */
  keyGenerator?: (operation: string, args: any[]) => string;
}

/**
 * Default cache options
 */
export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  strategy: CacheStrategy.NONE,
  ttl: 300, // 5 minutes
  clearOnMutation: true,
  persistent: false
};

