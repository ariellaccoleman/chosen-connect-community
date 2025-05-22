
import { createTagAssignmentRepository } from '../repository';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { TagApiOptions, TagAssignmentOperations } from './types';
import { logger } from '@/utils/logger';

/**
 * Create tag assignment API operations
 */
export function createTagAssignmentOperations(options: TagApiOptions = {}): TagAssignmentOperations {
  // Use import instead of require
  const tagAssignmentRepo = createTagAssignmentRepository();
  
  return {
    // Get assignments for entity
    getForEntity: async (entityId: string, entityType: EntityType) => {
      const response = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
      return response;
    },
    
    // Get entities by tag ID
    getEntitiesByTagId: async (tagId: string, entityType?: EntityType) => {
      logger.debug(`TagAssignmentOperations.getEntitiesByTagId: Getting entities with tag ${tagId}`);
      const response = await tagAssignmentRepo.getEntitiesWithTag(tagId, entityType);
      return response;
    },
    
    // Create assignment
    create: async (tagId: string, entityId: string, entityType: EntityType) => {
      const response = await tagAssignmentRepo.createTagAssignment({
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      });
      return response;
    },
    
    // Delete assignment
    delete: async (assignmentId: string) => {
      await tagAssignmentRepo.deleteTagAssignment(assignmentId);
      return true;
    },
    
    // Delete by tag and entity
    deleteByTagAndEntity: async (tagId: string, entityId: string, entityType: EntityType) => {
      logger.debug(`Deleting tag assignment for tag ${tagId} and entity ${entityId} of type ${entityType}`);
      
      try {
        // Get the assignment ID first
        const assignments = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
        const targetAssignment = assignments.find(a => a.tag_id === tagId);
        
        if (targetAssignment) {
          await tagAssignmentRepo.deleteTagAssignment(targetAssignment.id);
          return true;
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
      await tagAssignmentRepo.deleteTagAssignmentsForEntity(entityId, entityType);
      return true;
    },
    
    // Check if tag is assigned
    isTagAssigned: async (tagId: string, entityId: string, entityType: EntityType) => {
      try {
        const assignments = await tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
        return assignments.some(a => a.tag_id === tagId);
      } catch (error) {
        logger.error(`Error checking if tag ${tagId} is assigned to entity ${entityId}:`, error);
        return false;
      }
    }
  };
}
