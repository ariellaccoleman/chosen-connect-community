
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
      // Add debug logging to track host ID
      if (entityType === 'event') {
        const { data: event, error: eventError } = await client
          .from('events')
          .select('host_id')
          .eq('id', entityId)
          .single();
          
        if (eventError) {
          logger.error(`Failed to fetch event ${entityId} for host verification:`, eventError);
        } else {
          const { data: currentUser } = await client.auth.getUser();
          logger.info("Event host verification:", {
            eventId: entityId,
            eventHostId: event?.host_id || 'unknown',
            currentUserId: currentUser?.user?.id || 'not authenticated',
            isMatching: event?.host_id === currentUser?.user?.id
          });
        }
      }
      
      // Step 1: Update tag_entity_types to ensure this tag is associated with this entity type
      // First check if this association already exists to avoid redundant operations
      const { data: existingType, error: checkError } = await client
        .from('tag_entity_types')
        .select('id')
        .eq('tag_id', tagId)
        .eq('entity_type', entityType)
        .maybeSingle();
        
      if (checkError) {
        logger.error(`Failed to check existing tag entity type: ${checkError.message}`);
        // Continue despite this error, will attempt to create it
      }
      
      // If no existing association is found, create it
      if (!existingType) {
        const { error: insertError } = await client
          .from('tag_entity_types')
          .insert({
            tag_id: tagId,
            entity_type: entityType
          });

        if (insertError) {
          logger.error(`Failed to create tag entity type: ${insertError.message}`, {
            tagId,
            entityType,
            details: insertError
          });
          return createErrorResponse({
            message: `Failed to associate tag with entity type: ${insertError.message}`,
            code: "tag_entity_type_error"
          });
        }
        
        logger.info(`Created tag entity type association: tag ${tagId} with type ${entityType}`);
      } else {
        logger.info(`Tag entity type association already exists for tag ${tagId} and type ${entityType}`);
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
        .select('tag_id, target_type, target_id')
        .eq('id', assignmentId)
        .maybeSingle();
      
      if (getError) {
        logger.error("Error fetching tag assignment:", getError);
        return createErrorResponse(getError);
      }
      
      // Add debug logging for event host verification similar to assignTag
      if (assignment && assignment.target_type === 'event') {
        const { data: event, error: eventError } = await client
          .from('events')
          .select('host_id')
          .eq('id', assignment.target_id)
          .single();
          
        if (eventError) {
          logger.error(`Failed to fetch event ${assignment.target_id} for host verification:`, eventError);
        } else {
          const { data: currentUser } = await client.auth.getUser();
          logger.info("Event host verification (delete):", {
            eventId: assignment.target_id,
            eventHostId: event?.host_id || 'unknown',
            currentUserId: currentUser?.user?.id || 'not authenticated',
            isMatching: event?.host_id === currentUser?.user?.id
          });
        }
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
