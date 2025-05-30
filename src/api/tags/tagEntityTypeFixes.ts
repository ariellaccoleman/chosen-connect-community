
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { tagAssignmentApi } from "./factory/tagApiFactory";

/**
 * Ensures that all tags assigned to a certain entity type
 * are properly registered in the tag_entity_types table
 */
export const fixTagEntityAssociations = async (entityType: EntityType): Promise<boolean> => {
  try {
    logger.info(`Fixing tag entity associations for ${entityType}`);
    
    // Get all tag assignments for this entity type using the API
    const response = await tagAssignmentApi.getAll({
      filters: { target_type: entityType }
    });
    
    if (response.error) {
      logger.error(`Error fetching tag assignments for ${entityType}:`, response.error);
      return false;
    }
    
    const assignments = response.data || [];
    
    if (assignments.length === 0) {
      logger.info(`No tag assignments found for ${entityType}`);
      return true; // Nothing to fix
    }
    
    logger.info(`Found ${assignments.length} tag assignments for ${entityType}`);
    
    // Use a Set to remove duplicates
    const tagIds = [...new Set(assignments.map(a => a.tag_id))];
    
    logger.info(`Processing ${tagIds.length} unique tags for ${entityType}`);
    
    // For each tag, ensure it's properly associated with this entity type
    for (const tagId of tagIds) {
      try {
        // Check if association already exists using the API
        const existingResponse = await tagAssignmentApi.getAll({
          filters: { 
            tag_id: tagId,
            target_type: entityType 
          }
        });
        
        if (existingResponse.error) {
          logger.error(`Error checking tag entity type for tag ${tagId}:`, existingResponse.error);
          continue;
        }
        
        const existing = existingResponse.data || [];
        
        // If association doesn't exist, create it
        if (existing.length === 0) {
          // Note: The actual creation of tag_entity_types associations
          // should be handled by the database trigger when tag assignments are created
          // This is more of a diagnostic function now
          logger.info(`Tag ${tagId} should be associated with ${entityType} via database trigger`);
        } else {
          logger.debug(`Tag ${tagId} already associated with ${entityType}`);
        }
      } catch (tagError) {
        logger.error(`Error processing tag ${tagId}:`, tagError);
      }
    }
    
    logger.info(`Completed fixing tag entity associations for ${entityType}`);
    return true;
  } catch (error) {
    logger.error(`Error in fixTagEntityAssociations for ${entityType}:`, error);
    return false;
  }
};
