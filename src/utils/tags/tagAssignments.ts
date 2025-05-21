
import { supabase } from "@/integrations/supabase/client";
import { TagAssignment } from "./types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: EntityType | string
): Promise<boolean> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return false;
    }
    
    logger.debug(`Assigning tag ${tagId} to ${entityType} ${entityId}`);

    // First check if this assignment already exists to prevent duplicates
    const { data: existingAssignments, error: checkError } = await supabase
      .from("tag_assignments")
      .select("id")
      .eq("tag_id", tagId)
      .eq("target_id", entityId)
      .eq("target_type", entityType);

    if (checkError) {
      logger.error("Error checking for existing tag assignment:", checkError);
      return false;
    }

    // If the assignment doesn't exist, create it
    if (existingAssignments.length === 0) {
      const { error } = await supabase
        .from("tag_assignments")
        .insert({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType,
        });

      if (error) {
        logger.error("Error assigning tag:", error);
        return false;
      }
      
      // Also ensure that the tag is properly associated with this entity type
      // in the tag_entity_types table
      try {
        const { error: typeError } = await supabase
          .from("tag_entity_types")
          .upsert({
            tag_id: tagId,
            entity_type: entityType.toString()
          }, {
            onConflict: 'tag_id,entity_type'
          });
          
        if (typeError) {
          logger.warn("Error updating tag entity type:", typeError);
          // Continue anyway, this is not critical
        }
      } catch (typeErr) {
        logger.warn("Failed to update tag entity types:", typeErr);
        // This shouldn't prevent the tag assignment from working
      }
      
      logger.info(`Tag ${tagId} assigned to ${entityType} ${entityId}`);
      return true;
    }
    
    // Assignment already exists
    logger.info(`Tag ${tagId} is already assigned to ${entityType} ${entityId}`);
    return true;
  } catch (error) {
    logger.error("Error in assignTag:", error);
    return false;
  }
};

/**
 * Assign multiple tags to an entity
 */
export const assignTags = async (
  tagIds: string[],
  entityId: string,
  entityType: EntityType | string
): Promise<boolean> => {
  if (!tagIds.length) return true;
  
  try {
    const results = await Promise.all(
      tagIds.map(tagId => assignTag(tagId, entityId, entityType))
    );
    
    // Return true only if all assignments succeeded
    return results.every(Boolean);
  } catch (error) {
    logger.error("Error in assignTags:", error);
    return false;
  }
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("tag_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      logger.error("Error removing tag assignment:", error);
      toast.error("Failed to remove tag");
      return false;
    }
    
    logger.info(`Tag assignment ${assignmentId} removed`);
    return true;
  } catch (error) {
    logger.error("Error in removeTagAssignment:", error);
    return false;
  }
};

/**
 * Get tag assignments for an entity
 */
export const fetchEntityTags = async (
  entityId: string,
  entityType: EntityType | string
): Promise<TagAssignment[]> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return [];
    }

    const { data, error } = await supabase
      .from("tag_assignments")
      .select(`
        *,
        tag:tags(*)
      `)
      .eq("target_id", entityId)
      .eq("target_type", entityType);

    if (error) {
      logger.error("Error fetching entity tags:", error);
      return [];
    }

    return data as TagAssignment[];
  } catch (error) {
    logger.error("Error in fetchEntityTags:", error);
    return [];
  }
};

/**
 * Get entities that have a specific tag assigned
 */
export const fetchEntitiesWithTag = async (
  tagId: string,
  entityType?: EntityType | string
): Promise<TagAssignment[]> => {
  try {
    if (!tagId) return [];

    let query = supabase
      .from("tag_assignments")
      .select(`
        *,
        tag:tags(*)
      `)
      .eq("tag_id", tagId);

    // Add entity type filter if provided
    if (entityType && isValidEntityType(entityType)) {
      query = query.eq("target_type", entityType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching entities with tag:", error);
      return [];
    }

    return data as TagAssignment[];
  } catch (error) {
    logger.error("Error in fetchEntitiesWithTag:", error);
    return [];
  }
};
