
/**
 * Tag Assignment Service
 * Provides business logic for tag assignment operations
 */
import { TagAssignment } from '@/utils/tags';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
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
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    return this.assignmentRepo.getTagsForEntity(entityId, entityType);
  }
  
  /**
   * Get entities with a specific tag
   */
  async getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    logger.debug(`TagAssignmentService.getEntitiesWithTag: Fetching entities with tag ${tagId}`);
    return this.assignmentRepo.getAssignmentsByTagId(tagId, entityType);
  }
  
  /**
   * Assign a tag to an entity
   */
  async assignTag(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>> {
    logger.debug(`TagAssignmentService.assignTag: Assigning tag ${tagId} to entity ${entityId} of type ${entityType}`);
    
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    // Ensure the tag is associated with this entity type
    await this.entityTypeRepo.associateTagWithEntityType(tagId, entityType);
    
    // Create the assignment
    return this.assignmentRepo.createAssignment(tagId, entityId, entityType);
  }
  
  /**
   * Remove a tag assignment
   */
  async removeTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>> {
    logger.debug(`TagAssignmentService.removeTagAssignment: Removing tag assignment ${assignmentId}`);
    return this.assignmentRepo.deleteAssignment(assignmentId);
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
