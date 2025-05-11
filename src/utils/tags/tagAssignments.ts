
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logger";
import { handleError } from "../errorUtils";
import { TagAssignment } from "./types";
import { updateTagEntityType, removeTagEntityTypeIfUnused } from "./tagEntityTypes";

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
      const tagData = assignment.tag || {} as any;
        
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
