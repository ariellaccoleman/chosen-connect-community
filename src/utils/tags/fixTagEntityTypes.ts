
import { supabase } from "@/integrations/supabase/client";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Ensures that all tags used with a specific entity type have the proper entity_type association
 * This is useful for fixing existing tags that might have been created without proper entity type associations
 */
export async function fixTagEntityAssociations(entityType: EntityType): Promise<void> {
  try {
    logger.info(`Fixing tag entity associations for ${entityType}`);
    
    // 1. Get all tag assignments for this entity type
    const { data: assignments, error: assignmentsError } = await supabase
      .from("tag_assignments")
      .select("tag_id")
      .eq("target_type", entityType)
      .distinct();
      
    if (assignmentsError) {
      logger.error(`Error fetching tag assignments for ${entityType}:`, assignmentsError);
      return;
    }
    
    if (!assignments || assignments.length === 0) {
      logger.info(`No tag assignments found for ${entityType}`);
      return;
    }
    
    // Get all the unique tag IDs used with this entity type
    const tagIds = assignments.map(assignment => assignment.tag_id);
    logger.info(`Found ${tagIds.length} unique tags used with ${entityType}`);
    
    // 2. For each tag, ensure there's an entry in tag_entity_types
    for (const tagId of tagIds) {
      await ensureTagEntityType(tagId, entityType);
    }
    
    logger.info(`Completed fixing tag entity associations for ${entityType}`);
  } catch (error) {
    logger.error(`Error in fixTagEntityAssociations for ${entityType}:`, error);
  }
}

/**
 * Ensures a specific tag has the proper entity_type association
 */
export async function ensureTagEntityType(tagId: string, entityType: EntityType): Promise<void> {
  try {
    // Check if the entity type association already exists
    const { data, error } = await supabase
      .from("tag_entity_types")
      .select()
      .eq("tag_id", tagId)
      .eq("entity_type", entityType)
      .maybeSingle();
      
    if (error) {
      logger.error(`Error checking tag entity type for ${tagId}:`, error);
      return;
    }
    
    // If association doesn't exist, create it
    if (!data) {
      logger.info(`Creating association for tag ${tagId} with ${entityType}`);
      
      const { error: insertError } = await supabase
        .from("tag_entity_types")
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
        
      if (insertError) {
        logger.error(`Error creating tag entity type for ${tagId}:`, insertError);
      }
    } else {
      logger.debug(`Association already exists for tag ${tagId} with ${entityType}`);
    }
  } catch (error) {
    logger.error(`Error in ensureTagEntityType for ${tagId}:`, error);
  }
}
