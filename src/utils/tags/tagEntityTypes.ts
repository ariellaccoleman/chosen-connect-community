
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logger";
import { handleError } from "../errorUtils";

/**
 * Get entity types for a specific tag from the tag_entity_types table
 */
export const getTagEntityTypes = async (tagId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_entity_types')
      .select('entity_type')
      .eq('tag_id', tagId);
      
    if (error) {
      handleError(error, "Error fetching tag entity types");
      return [];
    }
    
    return data.map(item => item.entity_type);
  } catch (error) {
    handleError(error, "Error in getTagEntityTypes");
    return [];
  }
};

/**
 * Update the tag_entity_types table for a tag
 */
export const updateTagEntityType = async (tagId: string, entityType: string) => {
  try {
    // Check if this entity type already exists for this tag
    const { data: existingType, error: checkError } = await supabase
      .from('tag_entity_types')
      .select('id')
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .maybeSingle();
      
    if (checkError) {
      handleError(checkError, "Error checking tag entity type");
      return false;
    }
    
    // If entity type doesn't exist for this tag, add it
    if (!existingType) {
      const { error: insertError } = await supabase
        .from('tag_entity_types')
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
        
      if (insertError) {
        handleError(insertError, "Error adding tag entity type");
        return false;
      }
      
      logger.info(`Added entity type ${entityType} to tag ${tagId}`);
    }
    
    return true;
  } catch (error) {
    handleError(error, "Error in updateTagEntityType");
    return false;
  }
};

/**
 * Remove a tag entity type if no more assignments with that type exist
 */
export const removeTagEntityTypeIfUnused = async (tagId: string, entityType: string) => {
  try {
    // Check if there are any assignments with this tag and entity type
    const { data: assignments, error: checkError } = await supabase
      .from('tag_assignments')
      .select('id')
      .eq('tag_id', tagId)
      .eq('target_type', entityType)
      .limit(1);
      
    if (checkError) {
      handleError(checkError, "Error checking tag assignments");
      return false;
    }
    
    // If no assignments found, remove the entity type for this tag
    if (!assignments || assignments.length === 0) {
      const { error: removeError } = await supabase
        .from('tag_entity_types')
        .delete()
        .eq('tag_id', tagId)
        .eq('entity_type', entityType);
        
      if (removeError) {
        handleError(removeError, "Error removing tag entity type");
        return false;
      }
      
      logger.info(`Removed entity type ${entityType} from tag ${tagId}`);
    }
    
    return true;
  } catch (error) {
    handleError(error, "Error in removeTagEntityTypeIfUnused");
    return false;
  }
};
