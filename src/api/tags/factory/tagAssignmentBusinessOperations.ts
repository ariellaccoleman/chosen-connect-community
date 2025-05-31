
/**
 * Tag assignment business operations - complex operations that combine multiple steps
 * Updated with client injection support
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { createTagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

/**
 * Factory function to create tag assignment business operations with optional client injection
 */
export function createTagAssignmentBusinessOperations(client?: any) {
  // Get client-aware core operations
  const tagAssignmentBase = createTagAssignmentCoreOperations(client);

  return {
    /**
     * Create assignment with business-friendly signature
     */
    async create(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>> {
      const assignmentData = {
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      };
      
      return tagAssignmentBase.create(assignmentData as any);
    },

    /**
     * Get entities that have a specific tag assigned - complex query logic
     */
    async getEntitiesByTagId(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>> {
      const filters: any = { tag_id: tagId };
      if (entityType) {
        filters.target_type = entityType;
      }
      
      return tagAssignmentBase.getAll({ filters });
    },

    /**
     * Delete assignment by tag and entity - complex business operation
     */
    async deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
      // For base API, we need to find the assignment first
      const assignmentsResponse = await tagAssignmentBase.getAll({ 
        filters: { 
          tag_id: tagId, 
          target_id: entityId, 
          target_type: entityType 
        } 
      });
      
      if (assignmentsResponse.error || !assignmentsResponse.data?.length) {
        return createErrorResponse(assignmentsResponse.error || new Error('Assignment not found'));
      }
      
      const assignment = assignmentsResponse.data[0];
      return tagAssignmentBase.delete(assignment.id);
    },

    /**
     * Delete all assignments for an entity - complex business operation
     */
    async deleteForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
      // For base API, we need to find assignments first, then delete them
      const assignmentsResponse = await tagAssignmentBase.getAll({ 
        filters: { 
          target_id: entityId, 
          target_type: entityType 
        } 
      });
      
      if (assignmentsResponse.error) {
        return createErrorResponse(assignmentsResponse.error);
      }
      
      if (!assignmentsResponse.data?.length) {
        return createSuccessResponse(true);
      }
      
      // Delete all assignments
      const deletePromises = assignmentsResponse.data.map(assignment => 
        tagAssignmentBase.delete(assignment.id)
      );
      
      try {
        const results = await Promise.all(deletePromises);
        const allSuccessful = results.every(result => result.data === true);
        
        return createSuccessResponse(allSuccessful);
      } catch (error) {
        return createErrorResponse(error);
      }
    },

    /**
     * Check if tag is assigned to entity - business operation
     */
    async isTagAssigned(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
      const assignmentsResponse = await tagAssignmentBase.getAll({ 
        filters: { 
          tag_id: tagId, 
          target_id: entityId, 
          target_type: entityType 
        } 
      });
      
      if (assignmentsResponse.error) {
        return createErrorResponse(assignmentsResponse.error);
      }
      
      return createSuccessResponse((assignmentsResponse.data?.length || 0) > 0);
    }
  };
}

// Default export for backwards compatibility
export const tagAssignmentBusinessOperations = createTagAssignmentBusinessOperations();
