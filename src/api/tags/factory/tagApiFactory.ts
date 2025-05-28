/**
 * Tag API Factory
 * Creates tag-related API instances using the core API factory
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { apiClient } from '@/api/core/apiClient';

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

// Extended tag API that uses apiClient consistently
export const extendedTagApi = {
  // Basic CRUD operations using apiClient
  async getAll(client?: SupabaseClient): Promise<ApiResponse<Tag[]>> {
    return apiClient.query(async (supabaseClient) => {
      const { data, error } = await supabaseClient
        .from('tags')
        .select('*');
      
      if (error) throw error;
      return createSuccessResponse(data || []);
    }, client);
  },

  async getById(id: string, client?: SupabaseClient): Promise<ApiResponse<Tag | null>> {
    return apiClient.query(async (supabaseClient) => {
      const { data, error } = await supabaseClient
        .from('tags')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return createSuccessResponse(data || null);
    }, client);
  },

  async create(data: Partial<Tag>, client?: SupabaseClient): Promise<ApiResponse<Tag>> {
    return apiClient.query(async (supabaseClient) => {
      const { data: result, error } = await supabaseClient
        .from('tags')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return createSuccessResponse(result);
    }, client);
  },

  async update(id: string, data: Partial<Tag>, client?: SupabaseClient): Promise<ApiResponse<Tag>> {
    return apiClient.query(async (supabaseClient) => {
      const { data: result, error } = await supabaseClient
        .from('tags')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return createSuccessResponse(result);
    }, client);
  },

  async delete(id: string, client?: SupabaseClient): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (supabaseClient) => {
      const { error } = await supabaseClient
        .from('tags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return createSuccessResponse(true);
    }, client);
  },

  // Additional methods using apiClient
  async findByName(name: string, client?: SupabaseClient): Promise<ApiResponse<Tag | null>> {
    const allTagsResponse = await this.getAll(client);
    if (allTagsResponse.error) {
      return allTagsResponse;
    }
    
    const allTags = allTagsResponse.data || [];
    const foundTag = allTags.find(tag => tag.name === name) || null;
    
    return createSuccessResponse(foundTag);
  },

  async searchByName(searchQuery: string, client?: SupabaseClient): Promise<ApiResponse<Tag[]>> {
    if (!searchQuery.trim()) {
      return createSuccessResponse([]);
    }
    
    const allTagsResponse = await this.getAll(client);
    if (allTagsResponse.error) {
      return allTagsResponse;
    }
    
    const allTags = allTagsResponse.data || [];
    const filteredTags = allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return createSuccessResponse(filteredTags);
  },

  async getByEntityType(entityType: EntityType, client?: SupabaseClient): Promise<ApiResponse<Tag[]>> {
    // For now return all tags, TODO: Implement proper entity type filtering
    return this.getAll(client);
  },

  async findOrCreate(data: Partial<Tag>, entityType?: EntityType, client?: SupabaseClient): Promise<ApiResponse<Tag>> {
    if (data.name) {
      const existingResponse = await this.findByName(data.name, client);
      if (existingResponse.error) {
        return existingResponse;
      }
      
      if (existingResponse.data) {
        return createSuccessResponse(existingResponse.data);
      }
    }
    
    return this.create(data, client);
  }
};

// Tag assignment API using apiClient consistently
export const tagAssignmentApi = {
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
export const tagApi = extendedTagApi;

// Factory functions for creating API instances
export function createTagApiFactory(client?: SupabaseClient) {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory(client?: SupabaseClient) {
  return tagAssignmentApi;
}

// Export individual functions for backward compatibility - these need to unwrap responses
export const getAllTags = async (): Promise<Tag[]> => {
  const response = await extendedTagApi.getAll();
  return response.data || [];
};

export const getTagById = async (id: string): Promise<Tag | null> => {
  const response = await extendedTagApi.getById(id);
  return response.data || null;
};

export const findTagByName = async (name: string): Promise<Tag | null> => {
  const response = await extendedTagApi.findByName(name);
  return response.data || null;
};

export const searchTags = async (searchQuery: string): Promise<Tag[]> => {
  const response = await extendedTagApi.searchByName(searchQuery);
  return response.data || [];
};

export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  const response = await extendedTagApi.create(data);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const updateTag = async (id: string, data: Partial<Tag>): Promise<Tag> => {
  const response = await extendedTagApi.update(id, data);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const deleteTag = async (id: string): Promise<boolean> => {
  const response = await extendedTagApi.delete(id);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};

export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  const response = await extendedTagApi.findOrCreate(data, entityType);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  const response = await extendedTagApi.getByEntityType(entityType);
  return response.data || [];
};

export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  const response = await tagAssignmentApi.getForEntity(entityId, entityType);
  return response.data || [];
};

export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment> => {
  const response = await tagAssignmentApi.create(tagId, entityId, entityType);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const deleteTagAssignment = async (assignmentId: string): Promise<boolean> => {
  const response = await tagAssignmentApi.delete(assignmentId);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};
