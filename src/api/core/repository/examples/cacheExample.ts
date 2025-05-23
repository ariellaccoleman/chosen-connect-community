
/**
 * Example of using the cached repository
 * 
 * This file provides examples of how to implement and use the cached repository.
 * It is not meant to be imported in production code.
 */

import { createSupabaseRepository } from "../SupabaseRepository";
import { createCachedRepository } from "../cache/CachedRepository";
import { CacheStrategy } from "../cache/CacheConfig";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

// Example 1: Basic usage with default options (in-memory cache)
export function createSimpleCachedRepository<T>(tableName: string) {
  // Create the base repository
  const baseRepo = createSupabaseRepository<T>(tableName, supabase);
  
  // Wrap it with caching
  return createCachedRepository(baseRepo, {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 60, // 1 minute TTL
    clearOnMutation: true
  });
}

// Example 2: Advanced usage with persistent storage
export function createPersistentCachedRepository<T>(tableName: string) {
  // Create the base repository
  const baseRepo = createSupabaseRepository<T>(tableName, supabase);
  
  // Wrap it with caching
  return createCachedRepository(baseRepo, {
    strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
    ttl: 300, // 5 minutes TTL
    clearOnMutation: true,
    persistent: true, // Use localStorage
    keyGenerator: (operation, args) => {
      // Custom key generator that includes user ID for isolation
      const userId = 'anonymous'; // In a real app, get the user ID from auth
      return `${tableName}:${userId}:${operation}:${JSON.stringify(args)}`;
    }
  });
}

// Example 3: Usage with batch operations
export async function exampleCacheUsage() {
  try {
    // Profile repository with caching
    const profileRepo = createSimpleCachedRepository<any>('profiles');
    
    // First call will hit the database
    logger.debug('Fetching profiles (first call)');
    const firstCallStart = performance.now();
    const result1 = await profileRepo.select().limit(10).execute();
    const firstCallDuration = performance.now() - firstCallStart;
    
    // Second call should hit the cache and be faster
    logger.debug('Fetching profiles (second call, should be cached)');
    const secondCallStart = performance.now();
    const result2 = await profileRepo.select().limit(10).execute();
    const secondCallDuration = performance.now() - secondCallStart;
    
    logger.debug(`Performance comparison:
      First call: ${firstCallDuration.toFixed(2)}ms
      Second call: ${secondCallDuration.toFixed(2)}ms
      Speed improvement: ${(firstCallDuration / secondCallDuration).toFixed(2)}x`);
      
    return {
      firstCallResult: result1.data,
      secondCallResult: result2.data,
      performance: {
        firstCall: firstCallDuration,
        secondCall: secondCallDuration,
        improvement: firstCallDuration / secondCallDuration
      }
    };
  } catch (error) {
    logger.error('Error in example cache usage', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
