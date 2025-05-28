
/**
 * Tag API Factory
 * Creates tag-related API instances using the core API factory
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';

// Create the tag API using the core factory
export const tagApi = createApiFactory<Tag>('tags');

// Create tag assignment API
export const tagAssignmentApi = {
  async create(tagId: string, entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment> {
    const api = createApiFactory<TagAssignment>('tag_assignments', client);
    return api.create({
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    });
  },

  async delete(assignmentId: string, client?: SupabaseClient): Promise<boolean> {
    const api = createApiFactory<TagAssignment>('tag_assignments', client);
    return api.delete(assignmentId);
  },

  async getForEntity(entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    const api = createApiFactory<TagAssignment>('tag_assignments', client);
    return api.query((query) => 
      query
        .eq('target_id', entityId)
        .eq('target_type', entityType)
    );
  },

  async getEntitiesByTagId(tagId: string, entityType: EntityType, client?: SupabaseClient): Promise<TagAssignment[]> {
    const api = createApiFactory<TagAssignment>('tag_assignments', client);
    return api.query((query) => 
      query
        .eq('tag_id', tagId)
        .eq('target_type', entityType)
    );
  }
};
