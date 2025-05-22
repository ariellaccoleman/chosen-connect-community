/**
 * Tag Entity Type Repository
 * Handles data access operations for tag entity types
 */
import { createRepository, DataRepository } from '@/api/core/repository';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { logger } from '@/utils/logger';
import { EntityType, isValidEntityType } from '@/types/entityTypes';

/**
 * Interface for tag_entity_types table records
 */
export interface TagEntityType {
  id: string;
  tag_id: string;
  entity_type: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * TagEntityTypeRepository class that implements specialized methods for tag entity type operations
 */
export class TagEntityTypeRepository {
  private repo: DataRepository<TagEntityType>;
  
  constructor(repository: DataRepository<TagEntityType>) {
    this.repo = repository;
  }
  
  /**
   * Get entity types for a specific tag
   */
  async getEntityTypesForTag(tagId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await this.repo
        .select('entity_type')
        .eq('tag_id', tagId)
        .execute();
      
      if (error) throw error;
      
      const entityTypes = data ? data.map(item => item.entity_type) : [];
      return createSuccessResponse(entityTypes);
    } catch (error) {
      logger.error(`TagEntityTypeRepository.getEntityTypesForTag error for tagId ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Associate a tag with an entity type
   */
  async associateTagWithEntityType(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
    try {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      // Check if the association already exists
      const { data: existingAssociations } = await this.repo
        .select()
        .eq('tag_id', tagId)
        .eq('entity_type', entityType)
        .execute();
      
      // If association already exists, return success
      if (existingAssociations && existingAssociations.length > 0) {
        return createSuccessResponse(true);
      }
      
      // Otherwise, create a new association
      const { error } = await this.repo
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error(`TagEntityTypeRepository.associateTagWithEntityType error for tagId ${tagId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove association between a tag and an entity type
   */
  async removeEntityTypeFromTag(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
    try {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const { error } = await this.repo
        .delete()
        .eq('tag_id', tagId)
        .eq('entity_type', entityType);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error(`TagEntityTypeRepository.removeEntityTypeFromTag error for tagId ${tagId}:`, error);
      throw error;
    }
  }
}

/**
 * Create a TagEntityTypeRepository instance
 */
export function createTagEntityTypeRepository(): TagEntityTypeRepository {
  const repository = createRepository<TagEntityType>('tag_entity_types');
  return new TagEntityTypeRepository(repository);
}
