
import { EntityType } from "@/types/entityTypes";
import { invalidateCache } from "@/api/tags/invalidateCache";

/**
 * Clear tag cache for a specific entity type or all entity types
 */
export const invalidateTagCache = async (
  entityType?: EntityType
): Promise<boolean> => {
  try {
    if (entityType) {
      // Invalidate cache for specific entity type
      await invalidateCache(`tags_${entityType}`);
      console.log(`Invalidated tag cache for ${entityType}`);
    } else {
      // Invalidate all entity type caches
      await Promise.all([
        invalidateCache(`tags_${EntityType.PERSON}`),
        invalidateCache(`tags_${EntityType.ORGANIZATION}`),
        invalidateCache(`tags_${EntityType.EVENT}`)
      ]);
      console.log("Invalidated all tag caches");
    }
    return true;
  } catch (error) {
    console.error("Error invalidating tag cache:", error);
    return false;
  }
};
