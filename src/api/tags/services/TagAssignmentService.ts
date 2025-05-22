
/**
 * Tag Assignment Service
 * Provides business logic for tag assignment operations
 */
import { TagAssignment } from '@/utils/tags/types';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { 
  createTagAssignmentRepository, 
  TagAssignmentRepository 
} from '../repository';
import { createTagEntityTypeRepository, TagEntityTypeRepository } from '../repository';
import { logger } from '@/utils/logger';

/**
 * TagAssignmentService class for handling tag assignment business logic
 */
export class TagAssignmentService {
  private assignmentRepo: TagAssignmentRepository;
  private entityTypeRepo: TagEntityTypeRepository;
  
  constructor(
    assignmentRepository: TagAssignmentRepository,
    entityTypeRepository: TagEntityTypeRepository
  ) {
    this.assignmentRepo = assignmentRepository;
    this.entityTypeRepo = entityTypeRepository;
  }
  
  /**
   * Get tags assigned to a specific entity
   */
  async getTagsForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    logger.debug(`TagAssignmentService.getTagsForEntity: Fetching tags for entity ${entityId} of type ${entityType}`);
    
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return createErrorResponse(`Invalid entity type: ${entityType}`);
    }
    
    return await this.assignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
  }
  
  /**
   * Get entities with a specific tag
   */
  async getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    logger.debug(`TagAssignmentService.getEntitiesWithTag: Fetching entities with tag ${tagId}`);
    
    try {
      const assignments = await this.assignmentRepo.getEntitiesWithTag(tagId, entityType);
      return createSuccessResponse(assignments);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
  
  /**
   * Assign a tag to an entity
   */
  async assignTag(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>> {
    logger.debug(`TagAssignmentService.assignTag: Assigning tag ${tagId} to entity ${entityId} of type ${entityType}`);
    
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return createErrorResponse(`Invalid entity type: ${entityType}`);
    }
    
    try {
      // Ensure the tag is associated with this entity type
      await this.entityTypeRepo.associateTagWithEntityType(tagId, entityType);
      
      // Create the assignment
      return await this.assignmentRepo.createTagAssignment({
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }
  
  /**
   * Remove a tag assignment
   */
  async removeTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>> {
    logger.debug(`TagAssignmentService.removeTagAssignment: Removing tag assignment ${assignmentId}`);
    return await this.assignmentRepo.deleteTagAssignment(assignmentId);
  }
}

/**
 * Create a TagAssignmentService instance
 */
export function createTagAssignmentService(): TagAssignmentService {
  const assignmentRepo = createTagAssignmentRepository();
  const entityTypeRepo = createTagEntityTypeRepository();
  return new TagAssignmentService(assignmentRepo, entityTypeRepo);
}
