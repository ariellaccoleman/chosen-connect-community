
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
export const tagApi = createApiFactory<Tag>({
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

// Extended tag API with additional methods
export const extendedTagApi = {
  // Basic CRUD operations (delegated to core factory)
  getAll: () => tagApi.getAll(),
  getById: (id: string) => tagApi.getById(id),
  create: (data: Partial<Tag>) => tagApi.create(data),
  update: (id: string, data: Partial<Tag>) => tagApi.update(id, data),
  delete: (id: string) => tagApi.delete(id),

  // Additional methods needed by the application
  async findByName(name: string): Promise<Tag | null> {
    const results = await tagApi.query((query) => query.eq('name', name).limit(1));
    return results.length > 0 ? results[0] : null;
  },

  async searchByName(searchQuery: string): Promise<Tag[]> {
    if (!searchQuery.trim()) return [];
    return tagApi.query((query) => query.ilike('name', `%${searchQuery}%`));
  },

  async getByEntityType(entityType: EntityType): Promise<Tag[]> {
    // This would need a join with tag_entity_types, for now return all tags
    // TODO: Implement proper entity type filtering
    return tagApi.getAll();
  },

  async findOrCreate(data: Partial<Tag>, entityType?: EntityType): Promise<Tag> {
    if (data.name) {
      const existing = await extendedTagApi.findByName(data.name);
      if (existing) {
        return existing;
      }
    }
    return tagApi.create(data);
  }
};

// Tag assignment API with extended functionality
export const tagAssignmentApi = {
  async create(tagId: string, entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment> {
    return tagAssignmentApiBase.create({
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    });
  },

  async delete(assignmentId: string, client?: SupabaseClient): Promise<boolean> {
    return tagAssignmentApiBase.delete(assignmentId);
  },

  async getForEntity(entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    return tagAssignmentApiBase.query((query) => 
      query
        .eq('target_id', entityId)
        .eq('target_type', entityType)
    );
  },

  async getEntitiesByTagId(tagId: string, entityType?: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    return tagAssignmentApiBase.query((query) => {
      let q = query.eq('tag_id', tagId);
      if (entityType) {
        q = q.eq('target_type', entityType);
      }
      return q;
    });
  }
};

// Factory functions for creating API instances
export function createTagApiFactory(client?: SupabaseClient) {
  // For now, return the default instance
  // TODO: Implement client-specific instances if needed
  return extendedTagApi;
}

export function createTagAssignmentApiFactory(client?: SupabaseClient) {
  // For now, return the default instance
  // TODO: Implement client-specific instances if needed
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
