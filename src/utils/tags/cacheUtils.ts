
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to update tag cache for specific entity type 
 */
export const updateTagCache = async (entityType: "person" | "organization", data: any[]) => {
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
export const invalidateTagCache = async (entityType?: "person" | "organization") => {
  try {
    if (entityType) {
      // Delete specific entity type cache
      const cacheKey = `selection_tags_${entityType}`;
      await supabase
        .from('cache')
        .delete()
        .eq('key', cacheKey);
    } else {
      // Delete all selection_tags_* cache entries
      await supabase
        .from('cache')
        .delete()
        .or('key.like.selection_tags_person,key.like.selection_tags_organization');
    }
    return true;
  } catch (error) {
    console.error("Error invalidating tag cache:", error);
    return false;
  }
};
