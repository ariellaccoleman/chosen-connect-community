
/**
 * Tag Assignment Repository
 * Repository implementation for managing tag assignments
 */
import { apiClient } from "@/api/core/apiClient";
import { TagAssignment } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "@/api/core/errorHandler";

/**
 * Tag assignment repository interface
 */
export interface TagAssignmentRepository {
  /**
   * Get all tag assignments
   */
  getAllTagAssignments(): Promise<TagAssignment[]>;
  
  /**
   * Get tag assignments by tag ID
   */
  getTagAssignmentsByTagId(tagId: string): Promise<TagAssignment[]>;
  
  /**
   * Get tag assignments for a specific entity
   */
  getTagAssignmentsForEntity(entityId?: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>>;
  
  /**
   * Get entities with a specific tag
   */
  getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Create a tag assignment
   */
  createTagAssignment(data: Partial<TagAssignment>): Promise<ApiResponse<TagAssignment>>;
  
  /**
   * Delete a tag assignment
   */
  deleteTagAssignment(id?: string): Promise<ApiResponse<boolean>>;
  
  /**
   * Delete tag assignments for a tag
   */
  deleteTagAssignmentsForTag(tagId: string): Promise<void>;
  
  /**
   * Delete tag assignments for an entity
   */
  deleteTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<void>;
  
  /**
   * Get tags for an entity
   */
  getTagsForEntity(entityId?: string, entityType?: EntityType): Promise<ApiResponse<any[]>>;
  
  /**
   * Find a tag assignment
   */
  findTagAssignment(tagId?: string, targetId?: string, targetType?: EntityType): Promise<ApiResponse<TagAssignment | null>>;
}

/**
 * Create a tag assignment repository
 * @param providedClient - Optional Supabase client instance
 * @returns TagAssignmentRepository instance
 */
export function createTagAssignmentRepository(providedClient?: any): TagAssignmentRepository {
  
  return {
    async getAllTagAssignments(): Promise<TagAssignment[]> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_assignments')
            .select('*');
          
          if (error) throw error;
          return data || [];
        }, providedClient);
      } catch (err) {
        logger.error("Error fetching all tag assignments:", err);
        return [];
      }
    },
    
    async getTagAssignmentsByTagId(tagId: string): Promise<TagAssignment[]> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_assignments')
            .select('*')
            .eq('tag_id', tagId);
          
          if (error) throw error;
          return data || [];
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tag assignments for tag ${tagId}:`, err);
        return [];
      }
    },
    
    async getTagAssignmentsForEntity(
      entityId?: string, 
      entityType?: EntityType
    ): Promise<ApiResponse<TagAssignment[]>> {
      try {
        // Handle undefined parameters
        if (!entityId || !entityType) {
          return createSuccessResponse([]);
        }
        
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_assignments')
            .select(`*, tag:tags(*)`)
            .eq('target_id', entityId)
            .eq('target_type', entityType);
          
          if (error) throw error;
          return createSuccessResponse(data || []);
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tag assignments for entity ${entityId}:`, err);
        return createErrorResponse(`Failed to get tag assignments: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async getEntitiesWithTag(
      tagId: string, 
      entityType?: EntityType
    ): Promise<TagAssignment[]> {
      try {
        return await apiClient.query(async (client) => {
          let queryBuilder = client
            .from('tag_assignments')
            .select(`*, tag:tags(*)`)
            .eq('tag_id', tagId);
          
          if (entityType) {
            queryBuilder = queryBuilder.eq('target_type', entityType);
          }
          
          const { data, error } = await queryBuilder;
          if (error) throw error;
          
          if (!data) {
            logger.warn(`No entities found with tag ${tagId}`);
            return [];
          }
          
          return data;
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching entities with tag ${tagId}:`, err);
        return [];
      }
    },
    
    async createTagAssignment(
      data: Partial<TagAssignment>
    ): Promise<ApiResponse<TagAssignment>> {
      try {
        // Validate required fields
        if (!data.tag_id || !data.target_id || !data.target_type) {
          return createErrorResponse({ message: 'Missing required fields' });
        }
        
        return await apiClient.query(async (client) => {
          const { data: result, error } = await client
            .from('tag_assignments')
            .insert(data)
            .select()
            .single();
          
          if (error) throw error;
          if (!result) {
            return createErrorResponse({ message: "Failed to create tag assignment" });
          }
          
          return createSuccessResponse(result);
        }, providedClient);
      } catch (err) {
        logger.error("Error creating tag assignment:", err);
        return createErrorResponse(`Failed to create tag assignment: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async deleteTagAssignment(id?: string): Promise<ApiResponse<boolean>> {
      try {
        // Validate id
        if (!id) {
          return createErrorResponse({ message: 'Assignment ID is required' });
        }
        
        await apiClient.query(async (client) => {
          const { error } = await client
            .from('tag_assignments')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
        }, providedClient);
        
        return createSuccessResponse(true);
      } catch (err) {
        logger.error(`Error deleting tag assignment ${id}:`, err);
        return createErrorResponse(`Failed to delete tag assignment: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async deleteTagAssignmentsForTag(tagId: string): Promise<void> {
      try {
        await apiClient.query(async (client) => {
          const { error } = await client
            .from('tag_assignments')
            .delete()
            .eq('tag_id', tagId);
          
          if (error) throw error;
        }, providedClient);
      } catch (err) {
        logger.error(`Error deleting assignments for tag ${tagId}:`, err);
        throw err;
      }
    },
    
    async deleteTagAssignmentsForEntity(
      entityId: string, 
      entityType: EntityType
    ): Promise<void> {
      try {
        await apiClient.query(async (client) => {
          const { error } = await client
            .from('tag_assignments')
            .delete()
            .eq('target_id', entityId)
            .eq('target_type', entityType);
          
          if (error) throw error;
        }, providedClient);
      } catch (err) {
        logger.error(`Error deleting tag assignments for entity ${entityId}:`, err);
        throw err;
      }
    },
    
    async getTagsForEntity(
      entityId?: string, 
      entityType?: EntityType
    ): Promise<ApiResponse<any[]>> {
      try {
        // Handle undefined parameters
        if (!entityId || !entityType) {
          return createSuccessResponse([]);
        }
        
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_assignments')
            .select(`tag:tags(*), id`)
            .eq('target_id', entityId)
            .eq('target_type', entityType);
          
          if (error) throw error;
          
          if (!data) {
            return createSuccessResponse([]);
          }
          
          // Transform the data to flatten the structure
          // Extract the 'tag' property from each item and add the assignment_id
          const tags = data.map(item => ({
            ...((item.tag && typeof item.tag === 'object') ? item.tag : {}),
            assignment_id: item.id
          }));
          
          return createSuccessResponse(tags);
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tags for entity ${entityId}:`, err);
        return createErrorResponse(`Failed to get tags: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async findTagAssignment(
      tagId?: string, 
      targetId?: string, 
      targetType?: EntityType
    ): Promise<ApiResponse<TagAssignment | null>> {
      try {
        // Handle undefined parameters
        if (!tagId || !targetId || !targetType) {
          return createSuccessResponse(null);
        }
        
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_assignments')
            .select('*')
            .eq('tag_id', tagId)
            .eq('target_id', targetId)
            .eq('target_type', targetType)
            .maybeSingle();
          
          if (error) throw error;
          return createSuccessResponse(data || null);
        }, providedClient);
      } catch (err) {
        logger.error(`Error finding tag assignment:`, err);
        return createErrorResponse(`Failed to find tag assignment: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
}
