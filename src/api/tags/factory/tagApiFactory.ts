
/**
 * Tag API Factory
 * Creates tag-related API instances using the core API factory
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/api/core/errorHandler';
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

// Extended tag API that returns ApiResponse objects like other factories
export const extendedTagApi = {
  // Basic CRUD operations (returning ApiResponse)
  async getAll(client?: SupabaseClient): Promise<ApiResponse<Tag[]>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data, error } = await client
          .from('tags')
          .select('*');
        
        if (error) throw error;
        return { data: data || [], error: null, status: 'success' };
      });
    }
    return await tagApiBase.getAll();
  },

  async getById(id: string, client?: SupabaseClient): Promise<ApiResponse<Tag | null>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data, error } = await client
          .from('tags')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        return { data: data || null, error: null, status: 'success' };
      });
    }
    return await tagApiBase.getById(id);
  },

  async create(data: Partial<Tag>, client?: SupabaseClient): Promise<ApiResponse<Tag>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data: result, error } = await client
          .from('tags')
          .insert(data)
          .select('*')
          .single();
        
        if (error) throw error;
        return { data: result, error: null, status: 'success' };
      });
    }
    return await tagApiBase.create(data);
  },

  async update(id: string, data: Partial<Tag>, client?: SupabaseClient): Promise<ApiResponse<Tag>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data: result, error } = await client
          .from('tags')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();
        
        if (error) throw error;
        return { data: result, error: null, status: 'success' };
      });
    }
    return await tagApiBase.update(id, data);
  },

  async delete(id: string, client?: SupabaseClient): Promise<ApiResponse<boolean>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { error } = await client
          .from('tags')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return { data: true, error: null, status: 'success' };
      });
    }
    return await tagApiBase.delete(id);
  },

  // Additional methods that return ApiResponse
  async findByName(name: string, client?: SupabaseClient): Promise<ApiResponse<Tag | null>> {
    const allTagsResponse = await this.getAll(client);
    if (allTagsResponse.error) {
      return allTagsResponse;
    }
    
    const allTags = allTagsResponse.data || [];
    const foundTag = allTags.find(tag => tag.name === name) || null;
    
    return {
      data: foundTag,
      error: null,
      status: 'success'
    };
  },

  async searchByName(searchQuery: string, client?: SupabaseClient): Promise<ApiResponse<Tag[]>> {
    if (!searchQuery.trim()) {
      return {
        data: [],
        error: null,
        status: 'success'
      };
    }
    
    const allTagsResponse = await this.getAll(client);
    if (allTagsResponse.error) {
      return allTagsResponse;
    }
    
    const allTags = allTagsResponse.data || [];
    const filteredTags = allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      data: filteredTags,
      error: null,
      status: 'success'
    };
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
        return {
          data: existingResponse.data,
          error: null,
          status: 'success'
        };
      }
    }
    
    return this.create(data, client);
  }
};

// Tag assignment API that returns ApiResponse objects
export const tagAssignmentApi = {
  async create(tagId: string, entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data, error } = await client
          .from('tag_assignments')
          .insert({
            tag_id: tagId,
            target_id: entityId,
            target_type: entityType
          })
          .select('*')
          .single();
        
        if (error) throw error;
        return { data, error: null, status: 'success' };
      });
    }
    
    return await tagAssignmentApiBase.create({
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    });
  },

  async delete(assignmentId: string, client?: SupabaseClient): Promise<ApiResponse<boolean>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { error } = await client
          .from('tag_assignments')
          .delete()
          .eq('id', assignmentId);
        
        if (error) throw error;
        return { data: true, error: null, status: 'success' };
      });
    }
    return await tagAssignmentApiBase.delete(assignmentId);
  },

  async getForEntity(entityId: string, entityType: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment[]>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        const { data, error } = await client
          .from('tag_assignments')
          .select('*')
          .eq('target_id', entityId)
          .eq('target_type', entityType);
        
        if (error) throw error;
        return { data: data || [], error: null, status: 'success' };
      });
    }
    
    const response = await tagAssignmentApiBase.getAll();
    if (response.error) {
      return response;
    }
    
    const assignments = response.data || [];
    const filtered = assignments.filter(assignment => 
      assignment.target_id === entityId && assignment.target_type === entityType
    );
    
    return {
      data: filtered,
      error: null,
      status: 'success'
    };
  },

  async getEntitiesByTagId(tagId: string, entityType?: EntityType, client?: SupabaseClient): Promise<ApiResponse<TagAssignment[]>> {
    if (client) {
      return apiClient.query(async (supabaseClient) => {
        let query = client
          .from('tag_assignments')
          .select('*')
          .eq('tag_id', tagId);
        
        if (entityType) {
          query = query.eq('target_type', entityType);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { data: data || [], error: null, status: 'success' };
      });
    }
    
    const response = await tagAssignmentApiBase.getAll();
    if (response.error) {
      return response;
    }
    
    const assignments = response.data || [];
    const filtered = assignments.filter(assignment => {
      if (assignment.tag_id !== tagId) return false;
      if (entityType && assignment.target_type !== entityType) return false;
      return true;
    });
    
    return {
      data: filtered,
      error: null,
      status: 'success'
    };
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
