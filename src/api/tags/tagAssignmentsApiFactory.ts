
import { createApiFactory } from '@/api/core/factory';
import { TagAssignment } from '@/utils/tags/types';
import { createTagAssignmentsRepository, createEntityTagAssignmentsViewRepository } from './repositories';
import { logger } from '@/utils/logger';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { apiClient } from '@/api/core/apiClient';
import { EntityType } from '@/types/entityTypes';

/**
 * Create API operations for tag assignments using the factory pattern
 */
export const tagAssignmentsApi = createApiFactory<TagAssignment, string, Partial<TagAssignment>, Partial<TagAssignment>, 'tag_assignments'>(
  {
    tableName: 'tag_assignments',
    entityName: 'tag assignment',
    repository: createTagAssignmentsRepository(),
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: true
  }
);

/**
 * Create API operations for entity tag assignments view
 */
export const entityTagAssignmentsViewApi = createApiFactory<any, string, never, never, 'entity_tag_assignments_view'>(
  {
    tableName: 'entity_tag_assignments_view',
    entityName: 'entity tag assignment',
    repository: createEntityTagAssignmentsViewRepository(),
    useQueryOperations: true,
    useMutationOperations: false,
    useBatchOperations: false
  }
);

// Extract individual operations for direct usage
export const {
  getAll: getAllTagAssignments,
  getById: getTagAssignmentById,
  create: createTagAssignment,
  delete: deleteTagAssignment
} = tagAssignmentsApi;

export const {
  getAll: getAllEntityTagAssignments
} = entityTagAssignmentsViewApi;

/**
 * Assign a tag to an entity
 */
export const assignTag = async (
  tagId: string, 
  entityId: string, 
  entityType: EntityType | string
): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    try {
      logger.debug(`Assigning tag ${tagId} to ${entityType} ${entityId}`);

      // First check if this assignment already exists to prevent duplicates
      const { data: existingAssignments, error: checkError } = await client
        .from('tag_assignments')
        .select('id')
        .eq('tag_id', tagId)
        .eq('target_id', entityId)
        .eq('target_type', entityType);

      if (checkError) {
        logger.error("Error checking for existing tag assignment:", checkError);
        return createErrorResponse(checkError);
      }

      // If the assignment doesn't exist, create it
      if (!existingAssignments || existingAssignments.length === 0) {
        const { error } = await client
          .from('tag_assignments')
          .insert({
            tag_id: tagId,
            target_id: entityId,
            target_type: entityType.toString()
          });

        if (error) {
          logger.error("Error assigning tag:", error);
          return createErrorResponse(error);
        }
        
        // Also ensure that the tag is properly associated with this entity type
        try {
          const { updateTagEntityType } = await import('./tagEntityTypesApiFactory');
          await updateTagEntityType(tagId, entityType.toString());
        } catch (entityTypeError) {
          logger.warn("Error updating tag entity type:", entityTypeError);
          // Continue anyway, this is not critical
        }
        
        logger.info(`Tag ${tagId} assigned to ${entityType} ${entityId}`);
      } else {
        logger.info(`Tag ${tagId} is already assigned to ${entityType} ${entityId}`);
      }
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error("Error in assignTag:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string): Promise<ApiResponse<boolean>> => {
  try {
    const result = await deleteTagAssignment(assignmentId);
    return result.status === 'success' 
      ? createSuccessResponse(true) 
      : createErrorResponse(result.error);
  } catch (error) {
    logger.error("Error in removeTagAssignment:", error);
    return createErrorResponse(error);
  }
};

/**
 * Get entity tag assignments
 */
export const getEntityTagAssignments = async (
  entityId: string,
  entityType: EntityType | string
): Promise<ApiResponse<TagAssignment[]>> => {
  return apiClient.query(async (client) => {
    try {
      const { data, error } = await client
        .from("entity_tag_assignments_view")
        .select("*")
        .eq("target_id", entityId)
        .eq("target_type", entityType.toString());
      
      if (error) {
        logger.error("Error fetching entity tags:", error);
        return createErrorResponse(error);
      }

      return createSuccessResponse(data as TagAssignment[]);
    } catch (error) {
      logger.error("Error in getEntityTagAssignments:", error);
      return createErrorResponse(error);
    }
  });
};
