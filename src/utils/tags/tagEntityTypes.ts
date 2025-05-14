
import { EntityType } from "@/types/entityTypes";
import { supabase } from "@/integrations/supabase/client";
import { TagEntityType } from "./types";

/**
 * Get all entity types associated with a tag
 */
export const getTagEntityTypes = async (tagId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_entity_types')
      .select('entity_type')
      .eq('tag_id', tagId);
    
    if (error) {
      console.error("Error fetching tag entity types:", error);
      return [];
    }
    
    // Return the entity types as strings (for database compatibility)
    return data.map(item => item.entity_type);
  } catch (error) {
    console.error("Error in getTagEntityTypes:", error);
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
  const entityTypeStr = typeof entityType === 'string' ? entityType : entityType.toString();
  return entityTypes.includes(entityTypeStr);
};

/**
 * Get tag entity type associations
 */
export const getTagEntityTypeAssociations = async (tagId: string): Promise<TagEntityType[]> => {
  try {
    const { data, error } = await supabase
      .from('tag_entity_types')
      .select('*')
      .eq('tag_id', tagId);
    
    if (error) {
      console.error("Error fetching tag entity type associations:", error);
      return [];
    }
    
    return data as TagEntityType[];
  } catch (error) {
    console.error("Error in getTagEntityTypeAssociations:", error);
    return [];
  }
};
