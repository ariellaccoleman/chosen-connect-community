
import { logger } from "@/utils/logger";

/**
 * Interface for cache storage providers
 */
export interface CacheStorage<T = any> {
  /**
   * Get an item from cache
   */
  get(key: string): Promise<T | null>;
  
  /**
   * Set an item in cache
   */
  set(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Remove an item from cache
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;
  
  /**
   * Clear cache entries by pattern
   */
  clearPattern(pattern: string | RegExp): Promise<void>;
}

/**
 * In-memory cache storage implementation
 */
export class MemoryCacheStorage<T = any> implements CacheStorage<T> {
  private cache = new Map<string, { value: T; expires: number | null }>();
  
  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (entry.expires !== null && entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value, expires });
  }
  
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if entry has expired
    if (entry.expires !== null && entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async clearPattern(pattern: string | RegExp): Promise<void> {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Browser storage (localStorage) cache implementation
 */
export class BrowserCacheStorage<T = any> implements CacheStorage<T> {
  private prefix = 'repo_cache:';
  
  constructor(namespace: string = 'default') {
    this.prefix = `repo_cache:${namespace}:`;
  }
  
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  async get(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (!item) return null;
      
      const { value, expires } = JSON.parse(item);
      
      // Check if entry has expired
      if (expires !== null && expires < Date.now()) {
        localStorage.removeItem(fullKey);
        return null;
      }
      
      return value as T;
    } catch (err) {
      logger.error('Error getting item from browser cache', err);
      return null;
    }
  }
  
  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const expires = ttl ? Date.now() + (ttl * 1000) : null;
      
      localStorage.setItem(
        fullKey,
        JSON.stringify({ value, expires })
      );
    } catch (err) {
      logger.error('Error setting item in browser cache', err);
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      const result = await this.get(key);
      return result !== null;
    } catch (err) {
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (err) {
      logger.error('Error removing item from browser cache', err);
      return false;
    }
  }
  
  async clear(): Promise<void> {
    try {
      // Only clear keys with our prefix
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      logger.error('Error clearing browser cache', err);
    }
  }
  
  async clearPattern(pattern: string | RegExp): Promise<void> {
    try {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const shortKey = key.substring(this.prefix.length);
          if (regex.test(shortKey)) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      logger.error('Error clearing browser cache by pattern', err);
    }
  }
}

/**
 * Create appropriate cache storage based on environment and options
 */
export function createCacheStorage<T>(
  options: { 
    persistent?: boolean; 
    namespace?: string 
  } = {}
): CacheStorage<T> {
  const { persistent = false, namespace = 'default' } = options;
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && 
                   typeof localStorage !== 'undefined';
  
  if (persistent && isBrowser) {
    return new BrowserCacheStorage<T>(namespace);
  }
  
  return new MemoryCacheStorage<T>();
}
