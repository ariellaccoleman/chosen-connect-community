
import { createTagAssignmentRepository } from '../repository';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { TagApiOptions, TagAssignmentOperations } from './types';
import { logger } from '@/utils/logger';
import { ApiResponse, createErrorResponse } from '@/api/core/errorHandler';

/**
 * Create tag assignment API operations
 */
export function createTagAssignmentOperations(options: TagApiOptions = {}): TagAssignmentOperations {
  // Use repository pattern for data access
  const tagAssignmentRepo = createTagAssignmentRepository();
  
  return {
    // Get assignments for entity
    getForEntity: async (entityId: string, entityType: EntityType) => {
      try {
        const response = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        logger.error(`Error getting tag assignments for entity ${entityId}:`, error);
        return [];
      }
    },
    
    // Get entities by tag ID
    getEntitiesByTagId: async (tagId: string, entityType?: EntityType) => {
      logger.debug(`TagAssignmentOperations.getEntitiesByTagId: Getting entities with tag ${tagId}`);
      try {
        const assignments = await tagAssignmentRepo.getEntitiesWithTag(tagId, entityType);
        return assignments;
      } catch (error) {
        logger.error(`Error getting entities with tag ${tagId}:`, error);
        return [];
      }
    },
    
    // Create assignment
    create: async (tagId: string, entityId: string, entityType: EntityType) => {
      try {
        const response = await tagAssignmentRepo.createTagAssignment({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType
        });
        
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to create tag assignment');
      } catch (error) {
        logger.error(`Error creating tag assignment:`, error);
        throw error;
      }
    },
    
    // Delete assignment
    delete: async (assignmentId: string) => {
      try {
        const response = await tagAssignmentRepo.deleteTagAssignment(assignmentId);
        return response.status === 'success' && !!response.data;
      } catch (error) {
        logger.error(`Error deleting tag assignment ${assignmentId}:`, error);
        return false;
      }
    },
    
    // Delete by tag and entity
    deleteByTagAndEntity: async (tagId: string, entityId: string, entityType: EntityType) => {
      logger.debug(`Deleting tag assignment for tag ${tagId} and entity ${entityId} of type ${entityType}`);
      
      try {
        // Get the assignment ID first
        const assignmentsResponse = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
        
        if (assignmentsResponse.status === 'success' && assignmentsResponse.data) {
          const targetAssignment = assignmentsResponse.data.find(a => a.tag_id === tagId);
          
          if (targetAssignment) {
            const deleteResponse = await tagAssignmentRepo.deleteTagAssignment(targetAssignment.id);
            return deleteResponse.status === 'success' && !!deleteResponse.data;
          }
        }
        
        logger.warn(`No tag assignment found for tag ${tagId} and entity ${entityId}`);
        return false;
      } catch (error) {
        logger.error("Error deleting tag assignment by tag and entity:", error);
        return false;
      }
    },
    
    // Delete all assignments for an entity
    deleteForEntity: async (entityId: string, entityType: EntityType) => {
      try {
        await tagAssignmentRepo.deleteTagAssignmentsForEntity(entityId, entityType);
        return true;
      } catch (error) {
        logger.error(`Error deleting tag assignments for entity ${entityId}:`, error);
        return false;
      }
    },
    
    // Check if tag is assigned
    isTagAssigned: async (tagId: string, entityId: string, entityType: EntityType) => {
      try {
        const assignmentsResponse = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
        if (assignmentsResponse.status === 'success' && assignmentsResponse.data) {
          return assignmentsResponse.data.some(a => a.tag_id === tagId);
        }
        return false;
      } catch (error) {
        logger.error(`Error checking if tag ${tagId} is assigned to entity ${entityId}:`, error);
        return false;
      }
    }
  };
}
