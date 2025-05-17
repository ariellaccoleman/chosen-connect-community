
import { EntityType } from "@/types/entityTypes";
import { invalidateTagCache as invalidateTagCacheUtil } from "@/utils/tags";

/**
 * Clear tag cache for a specific entity type or all entity types
 */
export const invalidateTagCache = async (
  entityType?: EntityType
): Promise<boolean> => {
  try {
    const result = await invalidateTagCacheUtil(entityType);
    return result.error === null && (result.data === true);
  } catch (error) {
    console.error("Error invalidating tag cache:", error);
    return false;
  }
};

// Export the invalidateTagCache function directly from utils/tags for future use
export { invalidateTagCache as clearTagCache } from "@/utils/tags";
