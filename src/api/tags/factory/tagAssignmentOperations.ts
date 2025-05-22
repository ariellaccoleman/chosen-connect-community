
import { createTagAssignmentRepository } from '../repository';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { TagApiOptions, TagAssignmentOperations } from './types';

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
    
    // Delete all assignments for an entity
    deleteForEntity: async (entityId: string, entityType: EntityType) => {
      await tagAssignmentRepo.deleteTagAssignmentsForEntity(entityId, entityType);
      return true;
    }
  };
}
