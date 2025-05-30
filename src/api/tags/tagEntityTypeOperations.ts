
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { tagApi, tagAssignmentApi } from "./factory/tagApiFactory";
import { TagEntityType } from "@/utils/tags/types";

/**
 * Get all entity types associated with a tag
 */
export const getTagEntityTypes = async (tagId: string): Promise<string[]> => {
  try {
    // Get tag assignments for this tag to determine entity types
    const response = await tagAssignmentApi.getAll({
      filters: { tag_id: tagId }
    });
    
    if (response.error) {
      logger.error("Error fetching tag assignments:", response.error);
      return [];
    }
    
    const assignments = response.data || [];
    
    // Extract unique entity types from assignments
    const entityTypes = [...new Set(assignments.map(assignment => assignment.target_type))];
    return entityTypes.filter(Boolean);
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
    // Get tag assignments for this tag with tag details
    const response = await tagAssignmentApi.getAll({
      filters: { tag_id: tagId }
    });
    
    if (response.error) {
      logger.error("Error fetching tag entity type associations:", response.error);
      return [];
    }
    
    const assignments = response.data || [];
    
    // Convert assignments to TagEntityType format
    return assignments.map(assignment => ({
      id: assignment.id,
      tag_id: assignment.tag_id,
      entity_type: assignment.target_type,
      created_at: assignment.created_at || '',
      updated_at: assignment.updated_at || ''
    }));
  } catch (error) {
    logger.error("Error in getTagEntityTypeAssociations:", error);
    return [];
  }
};
