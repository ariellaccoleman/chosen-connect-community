/**
 * Tag Assignment Repository
 * Handles data access operations for tag assignments
 */
import { TagAssignment } from '@/utils/tags';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { createRepository, DataRepository } from '@/api/core/repository';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { logger } from '@/utils/logger';

/**
 * TagAssignmentRepository class that implements specialized methods for tag assignment operations
 */
export class TagAssignmentRepository {
  private repo: DataRepository<TagAssignment>;
  
  constructor(repository: DataRepository<TagAssignment>) {
    this.repo = repository;
  }
  
  /**
   * Get assignments for a specific tag
   */
  async getAssignmentsByTagId(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    try {
      let query = this.repo.select().eq('tag_id', tagId);
      
      // Add entity type filter if provided
      if (entityType && isValidEntityType(entityType)) {
        query = query.eq('target_type', entityType);
      }
      
      const { data, error } = await query.execute();
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    } catch (error) {
      logger.error(`TagAssignmentRepository.getAssignmentsByTagId error for tagId ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get tags assigned to a specific entity
   */
  async getTagsForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    try {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const { data, error } = await this.repo
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', entityId)
        .eq('target_type', entityType)
        .execute();
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    } catch (error) {
      logger.error(`TagAssignmentRepository.getTagsForEntity error for entityId ${entityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a tag assignment
   */
  async createAssignment(tagId: string, targetId: string, targetType: EntityType): Promise<ApiResponse<TagAssignment>> {
    try {
      // Validate entity type
      if (!isValidEntityType(targetType)) {
        throw new Error(`Invalid entity type: ${targetType}`);
      }
      
      // Check if the assignment already exists
      const { data: existingAssignments } = await this.repo
        .select()
        .eq('tag_id', tagId)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .execute();
      
      // If assignment already exists, return it
      if (existingAssignments && existingAssignments.length > 0) {
        return createSuccessResponse(existingAssignments[0]);
      }
      
      // Otherwise, create a new assignment
      const { data, error } = await this.repo
        .insert({
          tag_id: tagId,
          target_id: targetId,
          target_type: targetType
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('TagAssignmentRepository.createAssignment error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a tag assignment
   */
  async deleteAssignment(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.repo
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error(`TagAssignmentRepository.deleteAssignment error for id ${id}:`, error);
      throw error;
    }
  }
}

/**
 * Create a TagAssignmentRepository instance
 */
export function createTagAssignmentRepository(): TagAssignmentRepository {
  const repository = createRepository<TagAssignment>('tag_assignments');
  return new TagAssignmentRepository(repository);
}
