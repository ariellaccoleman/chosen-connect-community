
import { TagAssignment } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../core/errorHandler";
import { updateTagEntityType } from "./tagEntityTypesApi";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string,
  entityId: string,
  entityType: EntityType | string
): Promise<ApiResponse<TagAssignment>> => {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return apiClient.query(async (client) => {
    try {
      // Step 1: Update tag_entity_types to ensure this tag is associated with this entity type
      const entityTypeResponse = await updateTagEntityType(tagId, entityType);
      
      if (entityTypeResponse.status !== 'success') {
        logger.error(`Failed to update tag entity type: ${entityTypeResponse.error?.message}`);
        return createErrorResponse(entityTypeResponse.error || {
          message: "Failed to update tag entity type",
          code: "update_tag_entity_type_failed"
        });
      }
      
      // Step 2: Create the tag assignment
      const { data, error } = await client
        .from('tag_assignments')
        .insert({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType
        })
        .select('*, tag:tags(*)')
        .single();
      
      if (error) {
        // Provide more descriptive error for RLS violations
        if (error.code === '42501') { // PostgreSQL permission denied code
          const errorDetails = {
            code: "rls_violation",
            message: `Permission denied: You don't have permission to assign tags to this ${entityType}. Ensure you are the ${entityType === 'event' ? 'host of the event' : 'admin of the organization'}.`,
            details: error
          };
          logger.error("RLS violation in assignTag:", errorDetails);
          return createErrorResponse(errorDetails);
        }
        
        logger.error("Error in assignTag:", error);
        return createErrorResponse(error);
      }
      
      logger.info(`Successfully assigned tag ${tagId} to ${entityType} ${entityId}`);
      return createSuccessResponse(data);
    } catch (error) {
      logger.error("Exception in assignTag:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    try {
      // First get the assignment details to identify tag_id and entity_type
      const { data: assignment, error: getError } = await client
        .from('tag_assignments')
        .select('tag_id, target_type')
        .eq('id', assignmentId)
        .maybeSingle();
      
      if (getError) {
        logger.error("Error fetching tag assignment:", getError);
        return createErrorResponse(getError);
      }
      
      // Delete the assignment
      const { error: deleteError } = await client
        .from('tag_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (deleteError) {
        // Provide more descriptive error for RLS violations
        if (deleteError.code === '42501') { // PostgreSQL permission denied code
          const entityType = assignment?.target_type || 'entity';
          const errorDetails = {
            code: "rls_violation",
            message: `Permission denied: You don't have permission to remove tags from this ${entityType}. Ensure you are the ${entityType === 'event' ? 'host of the event' : 'admin of the organization'}.`,
            details: deleteError
          };
          logger.error("RLS violation in removeTagAssignment:", errorDetails);
          return createErrorResponse(errorDetails);
        }
        
        logger.error("Error deleting tag assignment:", deleteError);
        return createErrorResponse(deleteError);
      }
      
      // If we found the assignment details, check if we need to update tag_entity_types
      if (assignment) {
        const tagId = assignment.tag_id;
        const entityType = assignment.target_type;
        
        // Check if this tag has any other assignments with this entity type
        const { data: otherAssignments, error: checkError } = await client
          .from('tag_assignments')
          .select('id')
          .eq('tag_id', tagId)
          .eq('target_type', entityType)
          .neq('id', assignmentId)
          .limit(1);
        
        if (checkError) {
          logger.error("Error checking other tag assignments:", checkError);
          // Continue despite this error, just log it
        }
        
        // If no other assignments with this type, remove from tag_entity_types
        if (!otherAssignments || otherAssignments.length === 0) {
          const { error: removeError } = await client
            .from('tag_entity_types')
            .delete()
            .eq('tag_id', tagId)
            .eq('entity_type', entityType);
          
          if (removeError) {
            logger.error("Error removing tag entity type:", removeError);
            // Continue despite this error, just log it
          }
        }
      }
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error("Exception in removeTagAssignment:", error);
      return createErrorResponse(error);
    }
  });
};
