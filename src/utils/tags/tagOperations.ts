
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logger";
import { handleError } from "../errorUtils";
import { Tag } from "./types";

/**
 * Fetch tags with optional filtering
 */
export const fetchTags = async (options: { 
  type?: string; 
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: "person" | "organization"; // Parameter for filtering by entity type
} = {}) => {
  try {
    // Start with base query
    let query = supabase.from("tags").select("*");
    
    // Apply filters if provided
    if (options.type) {
      query = query.eq("type", options.type);
    }
    
    if (options.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic);
    }
    
    if (options.createdBy) {
      query = query.eq("created_by", options.createdBy);
    }
    
    if (options.searchQuery) {
      query = query.ilike("name", `%${options.searchQuery}%`);
    }
    
    // Use the tag_entity_types table for entity type filtering
    if (options.targetType) {
      // First get all tag IDs that have this entity type
      const { data: tagIds, error: tagIdsError } = await supabase
        .from('tag_entity_types')
        .select('tag_id')
        .eq('entity_type', options.targetType);
        
      if (tagIdsError) {
        console.error("Error fetching tag IDs for entity type:", tagIdsError);
        throw tagIdsError;
      }
      
      // If we have tags with this entity type
      if (tagIds && tagIds.length > 0) {
        const tagIdsArray = tagIds.map(item => item.tag_id);
        
        // Get all tag IDs that have any entity type
        const { data: allTagsWithEntityTypes, error: allTagsError } = await supabase
          .from('tag_entity_types')
          .select('tag_id');
          
        if (allTagsError) {
          console.error("Error fetching all tag IDs with entity types:", allTagsError);
          throw allTagsError;
        }
        
        // Get unique tag IDs by converting to a Set and back to an array
        const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
        
        if (uniqueTagIdsWithTypes.length > 0) {
          // Get tags that either match our entity type or don't have any entity type
          query = query.or(`id.in.(${tagIdsArray.join(',')}),not.id.in.(${uniqueTagIdsWithTypes.join(',')})`);
        } else {
          // If no tags have entity types, just use the ones that match our entity type
          query = query.in('id', tagIdsArray);
        }
      } else {
        // If no tags have this entity type, get tags without any entity type
        const { data: allTagsWithEntityTypes, error: allTagsError } = await supabase
          .from('tag_entity_types')
          .select('tag_id');
          
        if (allTagsError) {
          console.error("Error fetching all tag IDs with entity types:", allTagsError);
          throw allTagsError;
        }
        
        // Get unique tag IDs by converting to a Set and back to an array
        const uniqueTagIdsWithTypes = Array.from(new Set(allTagsWithEntityTypes?.map(item => item.tag_id) || []));
        
        if (uniqueTagIdsWithTypes.length > 0) {
          // Get tags that don't have any entity type
          query = query.not('id', 'in', `(${uniqueTagIdsWithTypes.join(',')})`);
        }
      }
    }
    
    const { data, error } = await query.order("name");
    
    if (error) {
      console.error("Error in fetchTags query:", error);
      handleError(error, "Error fetching tags");
      return [];
    }
    
    return data as Tag[];
  } catch (error) {
    handleError(error, "Error in fetchTags");
    return [];
  }
};

/**
 * Create a new tag
 * Note: created_by must be set to auth.uid() to satisfy RLS
 */
export const createTag = async (tagData: {
  name: string;
  description?: string | null;
  type: string;
  is_public: boolean;
  created_by: string;
}) => {
  try {
    // Make sure created_by matches the authenticated user
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user.id) {
      handleError(new Error("User not authenticated"), "Authentication required");
      return null;
    }
    
    // Ensure created_by matches the current user's ID
    const safeTagData = {
      ...tagData,
      created_by: authData.session.user.id
    };
    
    const { data, error } = await supabase
      .from("tags")
      .insert(safeTagData)
      .select()
      .single();
    
    if (error) {
      handleError(error, "Error creating tag");
      return null;
    }
    
    logger.info(`Tag created: ${data.name}`);
    return data as Tag;
  } catch (error) {
    handleError(error, "Error in createTag");
    return null;
  }
};

/**
 * Update an existing tag
 */
export const updateTag = async (tagId: string, updates: Partial<Tag>) => {
  try {
    // Remove created_by from updates to prevent unauthorized changes
    const { created_by, ...safeUpdates } = updates;
    
    const { data, error } = await supabase
      .from("tags")
      .update(safeUpdates)
      .eq("id", tagId)
      .select()
      .single();
    
    if (error) {
      handleError(error, "Error updating tag");
      return null;
    }
    
    logger.info(`Tag updated: ${data.name}`);
    return data as Tag;
  } catch (error) {
    handleError(error, "Error in updateTag");
    return null;
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId: string) => {
  try {
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);
    
    if (error) {
      handleError(error, "Error deleting tag");
      return false;
    }
    
    logger.info(`Tag deleted: ${tagId}`);
    return true;
  } catch (error) {
    handleError(error, "Error in deleteTag");
    return false;
  }
};
