import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import { handleError } from "./errorUtils";

export type Tag = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TagAssignment = {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at: string;
  updated_at: string;
  tag?: Tag;
};

export type TagEntityType = {
  id: string;
  tag_id: string;
  entity_type: string;
  created_at: string;
  updated_at: string;
};

export const TAG_TYPES = {
  PERSON: "person",
  ORGANIZATION: "organization",
};

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

/**
 * Fetch tag assignments for a specific entity
 */
export const fetchEntityTags = async (entityId: string, entityType: "person" | "organization") => {
  try {
    const { data, error } = await supabase
      .from("tag_assignments")
      .select(`
        *,
        tag:tags(*)
      `)
      .eq("target_id", entityId)
      .eq("target_type", entityType);
    
    if (error) {
      console.error("Error fetching entity tags:", error);
      handleError(error, "Error fetching entity tags");
      return [];
    }
    
    // Ensure proper typing for tag assignments
    const formattedAssignments = (data || []).map(assignment => {
      // Use type assertion to help TypeScript understand the structure
      const tagData = assignment.tag || {} as Partial<Tag>;
        
      return {
        ...assignment,
        updated_at: assignment.updated_at || assignment.created_at,
        tag: {
          ...tagData
        }
      } as TagAssignment;
    });
    
    return formattedAssignments;
  } catch (error) {
    handleError(error, "Error in fetchEntityTags");
    return [];
  }
};

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
const updateTagEntityType = async (tagId: string, entityType: string) => {
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
const removeTagEntityTypeIfUnused = async (tagId: string, entityType: string) => {
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

/**
 * Assign a tag to an entity
 * Modified to handle RLS properly and update tag_entity_types
 */
export const assignTag = async (tagId: string, entityId: string, entityType: "person" | "organization") => {
  try {
    // Get current auth session
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user.id) {
      handleError(new Error("User not authenticated"), "Authentication required");
      return null;
    }

    // Check permissions - users can only modify their own profiles unless they're admins
    if (entityType === "person" && entityId !== authData.session.user.id) {
      // For person entities, check if user is assigning to themselves
      // In a real app, check admin status here, but for simplicity we'll just block it
      handleError(new Error("Unauthorized operation"), "You can only assign tags to your own profile");
      return null;
    }
    
    // Check if assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from("tag_assignments")
      .select("id")
      .eq("tag_id", tagId)
      .eq("target_id", entityId)
      .eq("target_type", entityType)
      .maybeSingle();
    
    if (checkError) {
      handleError(checkError, "Error checking tag assignment");
      return null;
    }
    
    // If assignment already exists, return it
    if (existingAssignment) {
      logger.info("Tag assignment already exists");
      return existingAssignment;
    }
    
    // Create new assignment based on entity type
    const { data, error } = await supabase
      .from("tag_assignments")
      .insert({
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      })
      .select()
      .single();
    
    if (error) {
      handleError(error, "Error assigning tag");
      return null;
    }
    
    // Update the tag_entity_types table
    await updateTagEntityType(tagId, entityType);
    
    logger.info(`Tag assigned: ${tagId} to ${entityType} ${entityId}`);
    return data;
  } catch (error) {
    handleError(error, "Error in assignTag");
    return null;
  }
};

/**
 * Remove a tag from an entity
 */
export const removeTagAssignment = async (assignmentId: string) => {
  try {
    // Get current auth session to check permissions
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user.id) {
      handleError(new Error("User not authenticated"), "Authentication required");
      return false;
    }
    
    // We need to check if user has permission to remove this tag
    // First, get the assignment details
    const { data: assignment, error: fetchError } = await supabase
      .from("tag_assignments")
      .select("*")
      .eq("id", assignmentId)
      .maybeSingle();
      
    if (fetchError) {
      handleError(fetchError, "Error fetching tag assignment");
      return false;
    }
    
    // Check if user can remove this tag (if it's their own profile)
    if (assignment && assignment.target_type === "person" && assignment.target_id !== authData.session.user.id) {
      // In a real app, check admin status here
      handleError(new Error("Unauthorized operation"), "You can only remove tags from your own profile");
      return false;
    }

    // Now perform the delete operation
    const { error } = await supabase
      .from("tag_assignments")
      .delete()
      .eq("id", assignmentId);
    
    if (error) {
      handleError(error, "Error removing tag assignment");
      return false;
    }
    
    // Check if we should also remove this entity type from the tag
    if (assignment) {
      await removeTagEntityTypeIfUnused(assignment.tag_id, assignment.target_type);
    }
    
    logger.info(`Tag assignment removed: ${assignmentId}`);
    return true;
  } catch (error) {
    handleError(error, "Error in removeTagAssignment");
    return false;
  }
};

/**
 * Get a formatted display name for a tag based on its entity usage
 */
export const getTagDisplayName = async (tag: Tag, currentEntityType: "person" | "organization"): Promise<string> => {
  // Get entity types for this tag from the tag_entity_types table
  const entityTypes = await getTagEntityTypes(tag.id);
  
  if (!entityTypes || entityTypes.length === 0) {
    return tag.name;
  }
  
  // If the tag has been used with the current entity type, just show the name
  if (entityTypes.includes(currentEntityType)) {
    return tag.name;
  }
  
  // Otherwise, show the name with the entity types it has been used with
  const otherTypes = entityTypes
    .map(type => type === "person" ? "People" : "Organizations")
    .join(", ");
  
  return `${tag.name} (${otherTypes})`;
};
