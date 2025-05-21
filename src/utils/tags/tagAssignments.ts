import { apiClient } from "@/api/core/apiClient";
import { ApiResponse, createSuccessResponse } from "@/api/core/errorHandler";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { Tag, TagAssignment } from "./types";
import { logger } from "@/utils/logger";

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
      logger.error(`Invalid entity type: ${entityType}`);
      return [];
    }
    
    // Use the API method to fetch entity tags
    const { getEntityTags } = await import("@/api/tags/entityTagsApi");
    const response = await getEntityTags(entityId, entityType);
    
    if (response.status !== 'success' || !response.data) {
      logger.error("Error fetching entity tags:", response.error);
      return [];
    }
    
    return response.data;
  } catch (error) {
    logger.error("Error in fetchEntityTags:", error);
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
): Promise<ApiResponse<TagAssignment>> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      logger.error(`Invalid entity type: ${entityType}`);
      return {
        status: 'error',
        error: { message: `Invalid entity type: ${entityType}`, code: 'invalid_entity_type' },
        data: null
      };
    }
    
    logger.info("tagAssignments.ts: Calling assignTag API function with:", { tagId, entityId, entityType });
    
    // Call the API function for tag assignment
    const { assignTag: assignTagApi } = await import("@/api/tags/assignmentApi");
    return await assignTagApi(tagId, entityId, entityType);
  } catch (error) {
    logger.error("Error in assignTag:", error);
    return {
      status: 'error',
      error: { 
        message: error instanceof Error ? error.message : "Unknown error assigning tag",
        code: 'exception'
      },
      data: null
    };
  }
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<ApiResponse<boolean>> => {
  try {
    // Call the API function for removing tag assignment
    const { removeTagAssignment: removeTagAssignmentApi } = await import("@/api/tags/assignmentApi");
    return await removeTagAssignmentApi(assignmentId);
  } catch (error) {
    logger.error("Error in removeTagAssignment:", error);
    return {
      status: 'error',
      error: { 
        message: error instanceof Error ? error.message : "Unknown error removing tag assignment",
        code: 'exception'
      },
      data: null
    };
  }
};
