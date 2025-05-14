
import { supabase } from "@/integrations/supabase/client";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

/**
 * Utility function to update tag cache for specific entity type 
 */
export const updateTagCache = async (entityType: EntityType | string, data: any[]) => {
  if (!isValidEntityType(entityType)) {
    console.error(`Invalid entity type for cache: ${entityType}`);
    return false;
  }
  
  const cacheKey = `selection_tags_${entityType}`;
  
  try {
    await supabase.rpc('update_tag_cache', { 
      cache_key: cacheKey, 
      cache_data: data 
    });
    return true;
  } catch (error) {
    console.error("Error updating tag cache:", error);
    return false;
  }
};

/**
 * Utility function to invalidate tag cache
 */
export const invalidateTagCache = async (entityType?: EntityType | string) => {
  try {
    if (entityType) {
      if (!isValidEntityType(entityType)) {
        console.error(`Invalid entity type for cache invalidation: ${entityType}`);
        return false;
      }
      
      // Delete specific entity type cache
      const cacheKey = `selection_tags_${entityType}`;
      await supabase
        .from('cache')
        .delete()
        .eq('key', cacheKey);
    } else {
      // Delete all selection_tags_* cache entries for all known entity types
      const cachePatterns = Object.values(EntityType).map(type => `selection_tags_${type}`);
      
      // Construct an OR condition for all cache keys
      const orCondition = cachePatterns
        .map(pattern => `key.eq.${pattern}`)
        .join(',');
      
      await supabase
        .from('cache')
        .delete()
        .or(orCondition);
    }
    return true;
  } catch (error) {
    console.error("Error invalidating tag cache:", error);
    return false;
  }
};
