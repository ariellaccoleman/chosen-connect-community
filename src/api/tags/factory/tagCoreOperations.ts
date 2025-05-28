/**
 * Tag operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag API using the factory pattern
export const tagCoreOperations = createApiFactory<Tag>({
  tableName: 'tags',
  entityName: 'Tag',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*',
  defaultOrderBy: 'name',
  transformResponse: (item: any): Tag => ({
    id: item.id,
    name: item.name,
    description: item.description,
    created_by: item.created_by,
    created_at: item.created_at,
    updated_at: item.updated_at
  })
});

// Extended operations for tag-specific logic with client injection support
export const extendedTagOperations = {
  ...tagCoreOperations,
  
  async findByName(name: string, providedClient?: any): Promise<ApiResponse<Tag | null>> {
    // If client is provided, we need to use it directly instead of the factory
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tags')
          .select('*')
          .eq('name', name)
          .limit(1)
          .maybeSingle();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = data ? {
          id: data.id,
          name: data.name,
          description: data.description,
          created_by: data.created_by,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    // Use factory operations for non-client calls
    const response = await tagCoreOperations.getAll({ 
      filters: { name },
      limit: 1
    });
    
    if (response.error) {
      return {
        data: null,
        error: response.error,
        status: 'error'
      };
    }
    
    const tags = response.data || [];
    return {
      data: tags.length > 0 ? tags[0] : null,
      error: null,
      status: 'success'
    };
  },
  
  async searchByName(searchQuery: string, providedClient?: any): Promise<ApiResponse<Tag[]>> {
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tags')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .order('name');
        
        if (error) {
          return {
            data: [],
            error,
            status: 'error'
          };
        }
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: [],
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.getAll({ 
      filters: { name: { ilike: `%${searchQuery}%` } } 
    });
  },
  
  async getByEntityType(entityType: EntityType, providedClient?: any): Promise<ApiResponse<Tag[]>> {
    // This would need to join with tag_entity_types, but for now return all tags
    // The filtering will be handled at the application level
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tags')
          .select('*')
          .order('name');
        
        if (error) {
          return {
            data: [],
            error,
            status: 'error'
          };
        }
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: [],
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.getAll({});
  },
  
  async findOrCreate(data: Partial<Tag>, entityType?: EntityType, providedClient?: any): Promise<ApiResponse<Tag>> {
    // First try to find existing tag
    const existing = await this.findByName(data.name!, providedClient);
    if (existing.error) {
      return {
        data: null,
        error: existing.error,
        status: 'error'
      };
    }
    
    if (existing.data) {
      return {
        data: existing.data,
        error: null,
        status: 'success'
      };
    }
    
    // Create new tag if not found
    if (providedClient) {
      try {
        const { data: newTag, error } = await providedClient
          .from('tags')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = {
          id: newTag.id,
          name: newTag.name,
          description: newTag.description,
          created_by: newTag.created_by,
          created_at: newTag.created_at,
          updated_at: newTag.updated_at
        };
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.create(data);
  },
  
  // Override base operations to add client support
  async getAll(optionsOrClient?: any, providedClient?: any): Promise<ApiResponse<Tag[]>> {
    // Handle both old signature (options) and new signature with client
    const actualClient = providedClient || (typeof optionsOrClient === 'object' && optionsOrClient?.auth ? optionsOrClient : undefined);
    const actualOptions = actualClient ? optionsOrClient : (optionsOrClient || {});
    
    if (actualClient) {
      try {
        let query = actualClient.from('tags').select('*');
        
        // Apply filters if provided
        if (actualOptions?.filters) {
          Object.entries(actualOptions.filters).forEach(([key, value]: [string, any]) => {
            if (typeof value === 'object' && value.ilike) {
              query = query.ilike(key, value.ilike);
            } else {
              query = query.eq(key, value);
            }
          });
        }
        
        // Apply ordering
        if (actualOptions?.orderBy) {
          query = query.order(actualOptions.orderBy);
        } else {
          query = query.order('name');
        }
        
        // Apply limit
        if (actualOptions?.limit) {
          query = query.limit(actualOptions.limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          return {
            data: [],
            error,
            status: 'error'
          };
        }
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          created_by: item.created_by,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: [],
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.getAll(actualOptions);
  },
  
  async getById(id: string, providedClient?: any): Promise<ApiResponse<Tag | null>> {
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tags')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = data ? {
          id: data.id,
          name: data.name,
          description: data.description,
          created_by: data.created_by,
          created_at: data.created_at,
          updated_at: data.updated_at
        } : null;
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.getById(id);
  },
  
  async create(data: Partial<Tag>, providedClient?: any): Promise<ApiResponse<Tag>> {
    if (providedClient) {
      try {
        const { data: newTag, error } = await providedClient
          .from('tags')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = {
          id: newTag.id,
          name: newTag.name,
          description: newTag.description,
          created_by: newTag.created_by,
          created_at: newTag.created_at,
          updated_at: newTag.updated_at
        };
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.create(data);
  },
  
  async update(id: string, data: Partial<Tag>, providedClient?: any): Promise<ApiResponse<Tag>> {
    if (providedClient) {
      try {
        const { data: updatedTag, error } = await providedClient
          .from('tags')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          return {
            data: null,
            error,
            status: 'error'
          };
        }
        
        const transformedData = {
          id: updatedTag.id,
          name: updatedTag.name,
          description: updatedTag.description,
          created_by: updatedTag.created_by,
          created_at: updatedTag.created_at,
          updated_at: updatedTag.updated_at
        };
        
        return {
          data: transformedData,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: null,
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.update(id, data);
  },
  
  async delete(id: string, providedClient?: any): Promise<ApiResponse<boolean>> {
    if (providedClient) {
      try {
        const { error } = await providedClient
          .from('tags')
          .delete()
          .eq('id', id);
        
        if (error) {
          return {
            data: false,
            error,
            status: 'error'
          };
        }
        
        return {
          data: true,
          error: null,
          status: 'success'
        };
      } catch (error) {
        return {
          data: false,
          error,
          status: 'error'
        };
      }
    }
    
    return tagCoreOperations.delete(id);
  }
};
