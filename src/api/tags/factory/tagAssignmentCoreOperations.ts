/**
 * Tag assignment operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag assignment API using the factory pattern
const tagAssignmentBase = createApiFactory<TagAssignment>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*',
  transformResponse: (item: any): TagAssignment => ({
    id: item.id,
    tag_id: item.tag_id,
    target_id: item.target_id,
    target_type: item.target_type,
    created_at: item.created_at,
    updated_at: item.updated_at
  })
});

// Extended operations for tag assignment specific logic with client injection support
export const tagAssignmentCoreOperations = {
  ...tagAssignmentBase,
  
  async create(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<ApiResponse<TagAssignment>> {
    const assignmentData = {
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    };
    
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tag_assignments')
          .insert(assignmentData)
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
          id: data.id,
          tag_id: data.tag_id,
          target_id: data.target_id,
          target_type: data.target_type,
          created_at: data.created_at,
          updated_at: data.updated_at
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
    
    return tagAssignmentBase.create(assignmentData);
  },
  
  async getForEntity(entityId: string, entityType: EntityType, providedClient?: any): Promise<ApiResponse<TagAssignment[]>> {
    const filters = {
      target_id: entityId,
      target_type: entityType
    };
    
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tag_assignments')
          .select('*')
          .eq('target_id', entityId)
          .eq('target_type', entityType);
        
        if (error) {
          return {
            data: [],
            error,
            status: 'error'
          };
        }
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          tag_id: item.tag_id,
          target_id: item.target_id,
          target_type: item.target_type,
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
    
    return tagAssignmentBase.getAll({ filters });
  },
  
  async getEntitiesByTagId(tagId: string, entityType?: EntityType, providedClient?: any): Promise<ApiResponse<TagAssignment[]>> {
    if (providedClient) {
      try {
        let query = providedClient
          .from('tag_assignments')
          .select('*')
          .eq('tag_id', tagId);
        
        if (entityType) {
          query = query.eq('target_type', entityType);
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
          tag_id: item.tag_id,
          target_id: item.target_id,
          target_type: item.target_type,
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
    
    const filters: any = { tag_id: tagId };
    if (entityType) {
      filters.target_type = entityType;
    }
    
    return tagAssignmentBase.getAll({ filters });
  },
  
  // Override base operations to add client support
  async getAll(options?: any, providedClient?: any): Promise<ApiResponse<TagAssignment[]>> {
    if (providedClient) {
      try {
        let query = providedClient.from('tag_assignments').select('*');
        
        // Apply filters if provided
        if (options?.filters) {
          Object.entries(options.filters).forEach(([key, value]: [string, any]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data, error, count } = await query;
        
        if (error) {
          return {
            data: [],
            error,
            status: 'error'
          };
        }
        
        // Check if any rows were actually deleted
        const deletedCount = count || (data ? data.length : 0);
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          tag_id: item.tag_id,
          target_id: item.target_id,
          target_type: item.target_type,
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
    
    return tagAssignmentBase.getAll(options);
  },
  
  async getById(id: string, providedClient?: any): Promise<ApiResponse<TagAssignment | null>> {
    if (providedClient) {
      try {
        const { data, error } = await providedClient
          .from('tag_assignments')
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
          tag_id: data.tag_id,
          target_id: data.target_id,
          target_type: data.target_type,
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
    
    return tagAssignmentBase.getById(id);
  },
  
  async update(id: string, data: Partial<TagAssignment>, providedClient?: any): Promise<ApiResponse<TagAssignment>> {
    if (providedClient) {
      try {
        const { data: updatedAssignment, error } = await providedClient
          .from('tag_assignments')
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
          id: updatedAssignment.id,
          tag_id: updatedAssignment.tag_id,
          target_id: updatedAssignment.target_id,
          target_type: updatedAssignment.target_type,
          created_at: updatedAssignment.created_at,
          updated_at: updatedAssignment.updated_at
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
    
    return tagAssignmentBase.update(id, data);
  },
  
  async delete(id: string, providedClient?: any): Promise<ApiResponse<boolean>> {
    if (providedClient) {
      try {
        const { data, error, count } = await providedClient
          .from('tag_assignments')
          .delete()
          .eq('id', id)
          .select('id', { count: 'exact' });
        
        if (error) {
          return {
            data: false,
            error,
            status: 'error'
          };
        }
        
        // Check if any rows were actually deleted
        const deletedCount = count || (data ? data.length : 0);
        
        return {
          data: deletedCount > 0,
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
    
    return tagAssignmentBase.delete(id);
  }
};
