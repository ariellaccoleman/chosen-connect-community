
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
} = {}) => {
  try {
    let query = supabase
      .from("tags")
      .select("*");
    
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
    
    const { data, error } = await query.order("name");
    
    if (error) {
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
      handleError(error, "Error fetching entity tags");
      return [];
    }
    
    return data as TagAssignment[];
  } catch (error) {
    handleError(error, "Error in fetchEntityTags");
    return [];
  }
};

/**
 * Assign a tag to an entity
 * Modified to handle RLS properly
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
    
    // For organization entities, you might want to check if user is an admin of the org
    // This would need a more complex check with the organizations tables
    
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
      .single();
      
    if (fetchError) {
      handleError(fetchError, "Error fetching tag assignment");
      return false;
    }
    
    // Check if user can remove this tag (if it's their own profile)
    if (assignment.target_type === "person" && assignment.target_id !== authData.session.user.id) {
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
    
    logger.info(`Tag assignment removed: ${assignmentId}`);
    return true;
  } catch (error) {
    handleError(error, "Error in removeTagAssignment");
    return false;
  }
};
