/**
 * Tag Repository
 * Handles data access operations for tags
 */
import { Tag } from '@/utils/tags';
import { createRepository, DataRepository } from '@/api/core/repository';
import { apiClient } from '@/api/core/apiClient';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { logger } from '@/utils/logger';

/**
 * TagRepository class that implements specialized methods for tag operations
 */
export class TagRepository {
  private repo: DataRepository<Tag>;
  
  constructor(repository: DataRepository<Tag>) {
    this.repo = repository;
  }
  
  /**
   * Get all tags
   */
  async getAllTags(): Promise<ApiResponse<Tag[]>> {
    try {
      const { data, error } = await this.repo.select().execute();
      
      if (error) throw error;
      
      return createSuccessResponse(data || []);
    } catch (error) {
      logger.error('TagRepository.getAllTags error:', error);
      throw error;
    }
  }
  
  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<ApiResponse<Tag | null>> {
    try {
      const { data, error } = await this.repo.select().eq('id', id).maybeSingle();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    } catch (error) {
      logger.error(`TagRepository.getTagById error for id ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get tags by name
   */
  async getTagByName(name: string): Promise<ApiResponse<Tag | null>> {
    try {
      const { data, error } = await this.repo.select().eq('name', name).maybeSingle();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    } catch (error) {
      logger.error(`TagRepository.getTagByName error for name ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new tag
   */
  async createTag(tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    try {
      const { data, error } = await this.repo
        .insert({
          name: tag.name,
          description: tag.description,
          created_by: tag.created_by
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('TagRepository.createTag error:', error);
      throw error;
    }
  }
  
  /**
   * Update a tag
   */
  async updateTag(id: string, tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    try {
      const { data, error } = await this.repo
        .update({
          name: tag.name,
          description: tag.description
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return createSuccessResponse(data);
    } catch (error) {
      logger.error(`TagRepository.updateTag error for id ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.repo
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error(`TagRepository.deleteTag error for id ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Find or create a tag
   */
  async findOrCreateTag(tagData: Partial<Tag>): Promise<ApiResponse<Tag>> {
    try {
      // First try to find the tag by name
      const { data: existingTag } = await this.getTagByName(tagData.name || '');
      
      // If the tag exists, return it
      if (existingTag) {
        return createSuccessResponse(existingTag);
      }
      
      // Otherwise, create a new tag
      return this.createTag(tagData);
    } catch (error) {
      logger.error('TagRepository.findOrCreateTag error:', error);
      throw error;
    }
  }
}

/**
 * Create a TagRepository instance
 */
export function createTagRepository(): TagRepository {
  const repository = createRepository<Tag>('tags');
  return new TagRepository(repository);
}
