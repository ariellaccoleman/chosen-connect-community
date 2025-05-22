
/**
 * Tag Service
 * Provides business logic for tag operations
 */
import { Tag } from '@/utils/tags/types';
import { ApiResponse } from '@/api/core/types';
import { createTagRepository, TagRepository } from '../repository';
import { logger } from '@/utils/logger';
import { createSuccessResponse } from '@/api/core/errorHandler';

/**
 * TagService class for handling tag business logic
 */
export class TagService {
  private tagRepo: TagRepository;
  
  constructor(tagRepository: TagRepository) {
    this.tagRepo = tagRepository;
  }
  
  /**
   * Get all tags
   */
  async getAllTags(): Promise<ApiResponse<Tag[]>> {
    logger.debug('TagService.getAllTags: Fetching all tags');
    return this.tagRepo.getAllTags();
  }
  
  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<ApiResponse<Tag | null>> {
    logger.debug(`TagService.getTagById: Fetching tag with id ${id}`);
    return this.tagRepo.getTagById(id);
  }
  
  /**
   * Find or create a tag
   */
  async findOrCreateTag(tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    logger.debug(`TagService.findOrCreateTag: Finding or creating tag with name ${tagData.name}`);
    
    // Validate tag data
    if (!tagData.name) {
      throw new Error('Tag name is required');
    }
    
    return this.tagRepo.findOrCreateTag(tagData.name);
  }
  
  /**
   * Create a new tag
   */
  async createTag(tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    logger.debug(`TagService.createTag: Creating new tag with name ${tagData.name}`);
    
    // Validate tag data
    if (!tagData.name) {
      throw new Error('Tag name is required');
    }
    
    return this.tagRepo.createTag(tagData);
  }
  
  /**
   * Update a tag
   */
  async updateTag(id: string, tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    logger.debug(`TagService.updateTag: Updating tag with id ${id}`);
    return this.tagRepo.updateTag(id, tagData);
  }
  
  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<ApiResponse<boolean>> {
    logger.debug(`TagService.deleteTag: Deleting tag with id ${id}`);
    return this.tagRepo.deleteTag(id);
  }
}

/**
 * Create a TagService instance
 */
export function createTagService(): TagService {
  const tagRepo = createTagRepository();
  return new TagService(tagRepo);
}
