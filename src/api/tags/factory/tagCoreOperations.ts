
/**
 * Core tag operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse, createSuccessResponse } from '@/api/core/errorHandler';
import { apiClient } from '@/api/core/apiClient';

// Create the tag API using the core factory with proper configuration
const tagApiBase = createApiFactory<Tag>({
  tableName: 'tags',
  entityName: 'Tag',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*'
});

// Extended tag API that uses apiClient consistently
export const tagCoreOperations = {
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

// Export the base factory for raw access if needed
export const tagApiBaseFactory = tagApiBase;
