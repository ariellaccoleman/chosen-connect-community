
/**
 * Tag assignment business operations - complex operations that combine multiple steps
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag assignment API using the factory pattern for base operations
const tagAssignmentBase = createApiFactory<TagAssignment>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
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

// Business operations for tag assignments that involve complex logic
export const tagAssignmentBusinessOperations = {
  /**
   * Create assignment with business-friendly signature
   */
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
    
    return tagAssignmentBase.create(assignmentData as any);
  },

  /**
   * Get entities that have a specific tag assigned - complex query logic
   */
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

  /**
   * Delete assignment by tag and entity - complex business operation
   */
  async deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<ApiResponse<boolean>> {
    if (providedClient) {
      try {
        const { data, error, count } = await providedClient
          .from('tag_assignments')
          .delete()
          .eq('tag_id', tagId)
          .eq('target_id', entityId)
          .eq('target_type', entityType)
          .select('id', { count: 'exact' });
        
        if (error) {
          return {
            data: false,
            error,
            status: 'error'
          };
        }
        
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
    
    // For base API, we need to find the assignment first
    const assignmentsResponse = await tagAssignmentBase.getAll({ 
      filters: { 
        tag_id: tagId, 
        target_id: entityId, 
        target_type: entityType 
      } 
    });
    
    if (assignmentsResponse.error || !assignmentsResponse.data?.length) {
      return {
        data: false,
        error: assignmentsResponse.error,
        status: 'error'
      };
    }
    
    const assignment = assignmentsResponse.data[0];
    return tagAssignmentBase.delete(assignment.id);
  },

  /**
   * Delete all assignments for an entity - complex business operation
   */
  async deleteForEntity(entityId: string, entityType: EntityType, providedClient?: any): Promise<ApiResponse<boolean>> {
    if (providedClient) {
      try {
        const { data, error, count } = await providedClient
          .from('tag_assignments')
          .delete()
          .eq('target_id', entityId)
          .eq('target_type', entityType)
          .select('id', { count: 'exact' });
        
        if (error) {
          return {
            data: false,
            error,
            status: 'error'
          };
        }
        
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
    
    // For base API, we need to find assignments first, then delete them
    const assignmentsResponse = await tagAssignmentBase.getAll({ 
      filters: { 
        target_id: entityId, 
        target_type: entityType 
      } 
    });
    
    if (assignmentsResponse.error) {
      return {
        data: false,
        error: assignmentsResponse.error,
        status: 'error'
      };
    }
    
    if (!assignmentsResponse.data?.length) {
      return {
        data: true,
        error: null,
        status: 'success'
      };
    }
    
    // Delete all assignments
    const deletePromises = assignmentsResponse.data.map(assignment => 
      tagAssignmentBase.delete(assignment.id)
    );
    
    try {
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(result => result.data === true);
      
      return {
        data: allSuccessful,
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
  },

  /**
   * Check if tag is assigned to entity - business operation
   */
  async isTagAssigned(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<ApiResponse<boolean>> {
    const assignmentsResponse = await tagAssignmentBase.getAll({ 
      filters: { 
        tag_id: tagId, 
        target_id: entityId, 
        target_type: entityType 
      } 
    }, providedClient);
    
    if (assignmentsResponse.error) {
      return {
        data: false,
        error: assignmentsResponse.error,
        status: 'error'
      };
    }
    
    return {
      data: (assignmentsResponse.data?.length || 0) > 0,
      error: null,
      status: 'success'
    };
  }
};
