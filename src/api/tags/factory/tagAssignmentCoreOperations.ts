
/**
 * Core tag assignment operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { apiClient } from '@/api/core/apiClient';

// Create tag assignment API using the core factory
const tagAssignmentApiBase = createApiFactory<TagAssignment>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*'
});

// Tag assignment API using apiClient consistently
export const tagAssignmentCoreOperations = {
  async create(tagId: string, entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment>> {
    return apiClient.query(async (supabaseClient) => {
      const { data, error } = await supabaseClient
        .from('tag_assignments')
        .insert({
          tag_id: tagId,
          target_id: entityId,
          target_type: entityType
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return createSuccessResponse(data);
    }, client);
  },

  async delete(assignmentId: string, client?: SupabaseClient): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (supabaseClient) => {
      const { count, error } = await supabaseClient
        .from('tag_assignments')
        .delete({ count: 'exact' })
        .eq('id', assignmentId);
      
      if (error) throw error;
      return createSuccessResponse((count || 0) > 0);
    }, client);
  },

  async getForEntity(entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment[]>> {
    return apiClient.query(async (supabaseClient) => {
      const { data, error } = await supabaseClient
        .from('tag_assignments')
        .select('*')
        .eq('target_id', entityId)
        .eq('target_type', entityType);
      
      if (error) throw error;
      return createSuccessResponse(data || []);
    }, client);
  },

  async getEntitiesByTagId(tagId: string, entityType?: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment[]>> {
    return apiClient.query(async (supabaseClient) => {
      let query = supabaseClient
        .from('tag_assignments')
        .select('*')
        .eq('tag_id', tagId);
      
      if (entityType) {
        query = query.eq('target_type', entityType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return createSuccessResponse(data || []);
    }, client);
  }
};

// Export the base factory for raw access if needed
export const tagAssignmentApiBaseFactory = tagAssignmentApiBase;
