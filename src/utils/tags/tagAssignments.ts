
import { apiClient } from "@/api/core/apiClient";
import { ApiResponse, createSuccessResponse } from "@/api/core/errorHandler";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { Tag, TagAssignment } from "./types";

/**
 * Fetch tags assigned to a specific entity
 */
export const fetchEntityTags = async (
  entityId: string, 
  entityType: EntityType | string
): Promise<TagAssignment[]> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      console.error(`Invalid entity type: ${entityType}`);
      return [];
    }
    
    // Use the API method to fetch entity tags
    const { getEntityTags } = await import("@/api/tags/entityTagsApi");
    const response = await getEntityTags(entityId, entityType);
    
    if (response.status !== 'success' || !response.data) {
      console.error("Error fetching entity tags:", response.error);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in fetchEntityTags:", error);
    return [];
  }
};

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: EntityType | string
): Promise<TagAssignment | null> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      console.error(`Invalid entity type: ${entityType}`);
      return null;
    }
    
    // Call the API function for tag assignment
    const { assignTag: assignTagApi } = await import("@/api/tags/assignmentApi");
    const response = await assignTagApi(tagId, entityId, entityType);
    
    if (response.status !== 'success' || !response.data) {
      console.error("Error assigning tag:", response.error);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in assignTag:", error);
    throw error;
  }
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    // Call the API function for removing tag assignment
    const { removeTagAssignment: removeTagAssignmentApi } = await import("@/api/tags/assignmentApi");
    const response = await removeTagAssignmentApi(assignmentId);
    
    if (response.status !== 'success') {
      console.error("Error removing tag assignment:", response.error);
      return false;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in removeTagAssignment:", error);
    throw error;
  }
};
