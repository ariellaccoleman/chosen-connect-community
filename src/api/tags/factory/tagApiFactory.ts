
/**
 * Tag API Factory
 * Creates tag-related API instances using the core API factory
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/api/core/errorHandler';

// Create the tag API using the core factory with proper configuration
const tagApiBase = createApiFactory<Tag>({
  tableName: 'tags',
  entityName: 'Tag',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*'
});

// Create tag assignment API using the core factory
const tagAssignmentApiBase = createApiFactory<TagAssignment>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*'
});

// Extended tag API with additional methods that unwrap responses
export const extendedTagApi = {
  // Basic CRUD operations (unwrapping ApiResponse)
  async getAll(): Promise<Tag[]> {
    const response = await tagApiBase.getAll();
    return response.data || [];
  },

  async getById(id: string): Promise<Tag | null> {
    const response = await tagApiBase.getById(id);
    return response.data || null;
  },

  async create(data: Partial<Tag>): Promise<Tag> {
    const response = await tagApiBase.create(data);
    if (!response.data) {
      throw new Error(response.error || 'Failed to create tag');
    }
    return response.data;
  },

  async update(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await tagApiBase.update(id, data);
    if (!response.data) {
      throw new Error(response.error || 'Failed to update tag');
    }
    return response.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await tagApiBase.delete(id);
    return response.data === true;
  },

  // Additional methods needed by the application
  async findByName(name: string): Promise<Tag | null> {
    const allTags = await this.getAll();
    return allTags.find(tag => tag.name === name) || null;
  },

  async searchByName(searchQuery: string): Promise<Tag[]> {
    if (!searchQuery.trim()) return [];
    const allTags = await this.getAll();
    return allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  async getByEntityType(entityType: EntityType): Promise<Tag[]> {
    // For now return all tags, TODO: Implement proper entity type filtering
    return this.getAll();
  },

  async findOrCreate(data: Partial<Tag>, entityType?: EntityType): Promise<Tag> {
    if (data.name) {
      const existing = await this.findByName(data.name);
      if (existing) {
        return existing;
      }
    }
    return this.create(data);
  }
};

// Tag assignment API with extended functionality
export const tagAssignmentApi = {
  async create(tagId: string, entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment> {
    const response = await tagAssignmentApiBase.create({
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    });
    if (!response.data) {
      throw new Error(response.error || 'Failed to create tag assignment');
    }
    return response.data;
  },

  async delete(assignmentId: string, client?: SupabaseClient): Promise<boolean> {
    const response = await tagAssignmentApiBase.delete(assignmentId);
    return response.data === true;
  },

  async getForEntity(entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    const response = await tagAssignmentApiBase.getAll();
    const assignments = response.data || [];
    return assignments.filter(assignment => 
      assignment.target_id === entityId && assignment.target_type === entityType
    );
  },

  async getEntitiesByTagId(tagId: string, entityType?: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    const response = await tagAssignmentApiBase.getAll();
    const assignments = response.data || [];
    return assignments.filter(assignment => {
      if (assignment.tag_id !== tagId) return false;
      if (entityType && assignment.target_type !== entityType) return false;
      return true;
    });
  }
};

// Export the base factory for raw access if needed
export const tagApi = extendedTagApi;

// Factory functions for creating API instances
export function createTagApiFactory(client?: SupabaseClient) {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory(client?: SupabaseClient) {
  return tagAssignmentApi;
}

// Export individual functions for backward compatibility
export const getAllTags = extendedTagApi.getAll;
export const getTagById = extendedTagApi.getById;
export const findTagByName = extendedTagApi.findByName;
export const searchTags = extendedTagApi.searchByName;
export const createTag = extendedTagApi.create;
export const updateTag = extendedTagApi.update;
export const deleteTag = extendedTagApi.delete;
export const findOrCreateTag = extendedTagApi.findOrCreate;
export const getTagsByEntityType = extendedTagApi.getByEntityType;
export const getTagAssignmentsForEntity = tagAssignmentApi.getForEntity;
export const createTagAssignment = tagAssignmentApi.create;
export const deleteTagAssignment = tagAssignmentApi.delete;
