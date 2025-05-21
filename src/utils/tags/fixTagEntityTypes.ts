
import { supabase } from "@/integrations/supabase/client";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Ensures that all tags assigned to a certain entity type
 * are properly registered in the tag_entity_types table
 */
export const fixTagEntityAssociations = async (entityType: EntityType): Promise<boolean> => {
  try {
    logger.info(`Fixing tag entity associations for ${entityType}`);
    
    // First, get all tag assignments for this entity type
    const { data: assignments, error: fetchError } = await supabase
      .from("tag_assignments")
      .select("tag_id")
      .eq("target_type", entityType);
      
    if (fetchError) {
      logger.error(`Error fetching tag assignments for ${entityType}:`, fetchError);
      return false;
    }
    
    if (!assignments || assignments.length === 0) {
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
        // Check if association already exists
        const { data: existing, error: checkError } = await supabase
          .from("tag_entity_types")
          .select("id")
          .eq("tag_id", tagId)
          .eq("entity_type", entityType);
          
        if (checkError) {
          logger.error(`Error checking tag entity type for tag ${tagId}:`, checkError);
          continue;
        }
        
        // If association doesn't exist, create it
        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabase
            .from("tag_entity_types")
            .insert({
              tag_id: tagId,
              entity_type: entityType
            });
            
          if (insertError) {
            logger.error(`Error inserting tag entity type for tag ${tagId}:`, insertError);
          } else {
            logger.info(`Added entity type ${entityType} to tag ${tagId}`);
          }
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
