
/**
 * Tag API Factory with Caching
 * 
 * Enhanced version of the tag API factory with built-in caching
 */
import { createSupabaseRepository } from "@/api/core/repository/SupabaseRepository";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { createCachedRepository } from "@/api/core/repository/cache";
import { CacheStrategy } from "@/api/core/repository/cache/CacheConfig";
import { logger } from "@/utils/logger";

/**
 * Create a cached tag repository
 */
export function createCachedTagRepository() {
  const baseRepo = createSupabaseRepository<Tag>("tags", supabase);
  
  return createCachedRepository(baseRepo, {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 300, // 5 minutes
    clearOnMutation: true,
    persistent: false // Use in-memory cache
  });
}

/**
 * Tag API with caching
 */
export const cachedTagApi = {
  /**
   * Get all tags with caching
   */
  async getAll(): Promise<Tag[]> {
    try {
      const tagRepo = createCachedTagRepository();
      const result = await tagRepo.select().order('name', { ascending: true }).execute();
      return result.data || [];
    } catch (err) {
      logger.error("Error fetching all tags:", err);
      return [];
    }
  },
  
  /**
   * Get tags by entity type with caching
   */
  async getByEntityType(entityType: EntityType): Promise<Tag[]> {
    try {
      const tagRepo = createCachedTagRepository();
      const result = await tagRepo.select(`
        SELECT DISTINCT t.*
        FROM tags t
        JOIN tag_entity_types tet ON t.id = tet.tag_id
        WHERE tet.entity_type = '${entityType}'
        ORDER BY t.name ASC
      `).execute();
      return result.data || [];
    } catch (err) {
      logger.error(`Error fetching tags for entity type ${entityType}:`, err);
      return [];
    }
  },
  
  /**
   * Other API methods would be implemented similar to the existing tag API
   * but using the cached repository
   */
};

// Export the cached tag API implementation for use in applications
export default cachedTagApi;
