
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { tagApi, tagAssignmentApi } from "./factory/tagApiFactory";
import { TagEntityType } from "@/utils/tags/types";

/**
 * Get all entity types associated with a tag
 */
export const getTagEntityTypes = async (tagId: string): Promise<string[]> => {
  try {
    // Use the tag API to get tag entity type associations
    const response = await tagApi.getAll({
      filters: { id: tagId },
      select: 'id,tag_entity_types(entity_type)'
    });
    
    if (response.error) {
      logger.error("Error fetching tag entity types:", response.error);
      return [];
    }
    
    const tag = response.data?.[0];
    if (!tag || !tag.tag_entity_types) {
      return [];
    }
    
    // Extract entity types from the related data
    return tag.tag_entity_types.map((item: any) => item.entity_type);
  } catch (error) {
    logger.error("Error in getTagEntityTypes:", error);
    return [];
  }
};

/**
 * Check if a tag is associated with a specific entity type
 */
export const isTagAssociatedWithEntityType = async (
  tagId: string, 
  entityType: EntityType | string
): Promise<boolean> => {
  const entityTypes = await getTagEntityTypes(tagId);
  // Convert EntityType enum to string if needed
  const entityTypeStr = typeof entityType === 'string' ? entityType : entityType;
  return entityTypes.includes(entityTypeStr);
};

/**
 * Get tag entity type associations
 */
export const getTagEntityTypeAssociations = async (tagId: string): Promise<TagEntityType[]> => {
  try {
    // Use the tag API to get tag entity type associations
    const response = await tagApi.getAll({
      filters: { id: tagId },
      select: 'id,tag_entity_types(*)'
    });
    
    if (response.error) {
      logger.error("Error fetching tag entity type associations:", response.error);
      return [];
    }
    
    const tag = response.data?.[0];
    if (!tag || !tag.tag_entity_types) {
      return [];
    }
    
    return tag.tag_entity_types as TagEntityType[];
  } catch (error) {
    logger.error("Error in getTagEntityTypeAssociations:", error);
    return [];
  }
};
