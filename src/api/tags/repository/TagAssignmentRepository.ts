
/**
 * Tag Assignment Repository
 * Repository implementation for managing tag assignments
 */
import { createSupabaseRepository } from "@/api/core/repository/repositoryFactory";
import { supabase } from "@/integrations/supabase/client";
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
 * @returns TagAssignmentRepository instance
 */
export function createTagAssignmentRepository(): TagAssignmentRepository {
  const repository = createSupabaseRepository<TagAssignment>("tag_assignments", supabase);
  
  return {
    async getAllTagAssignments(): Promise<TagAssignment[]> {
      try {
        const result = await repository.getAll();
        return result || [];
      } catch (err) {
        logger.error("Error fetching all tag assignments:", err);
        return [];
      }
    },
    
    async getTagAssignmentsByTagId(tagId: string): Promise<TagAssignment[]> {
      try {
        const query = repository.select()
                               .eq('tag_id', tagId);
        const result = await query.execute();
        return result.data || [];
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
        
        const query = repository.select(`*, tag:tags(*)`)
                               .eq('target_id', entityId)
                               .eq('target_type', entityType);
        const result = await query.execute();
        return createSuccessResponse(result.data || []);
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
        let query = repository.select().eq('tag_id', tagId);
        
        if (entityType) {
          query = query.eq('target_type', entityType);
        }
        
        const result = await query.execute();
        
        if (!result.data) {
          logger.warn(`No entities found with tag ${tagId}`);
          return [];
        }
        
        return result.data;
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
        
        const result = await repository.insert(data).execute();
        
        if (!result.data) {
          return createErrorResponse({ message: "Failed to create tag assignment" });
        }
        
        return createSuccessResponse(result.data[0]);
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
        
        await repository.delete().eq('id', id).execute();
        return createSuccessResponse(true);
      } catch (err) {
        logger.error(`Error deleting tag assignment ${id}:`, err);
        return createErrorResponse(`Failed to delete tag assignment: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async deleteTagAssignmentsForTag(tagId: string): Promise<void> {
      try {
        await repository.delete().eq('tag_id', tagId).execute();
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
        await repository.delete()
                      .eq('target_id', entityId)
                      .eq('target_type', entityType)
                      .execute();
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
        
        const query = repository.select(`
          tags:tag_id(id, name, description, created_at, updated_at, created_by),
          id
        `)
        .eq('target_id', entityId)
        .eq('target_type', entityType);
        
        const result = await query.execute();
        
        if (!result.data) {
          return createSuccessResponse([]);
        }
        
        // Transform the data to flatten the structure
        // Extract the 'tags' property from each item and add the assignment_id
        const tags = result.data.map(item => ({
          ...(item.tags || {}),
          assignment_id: item.id
        }));
        
        return createSuccessResponse(tags);
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
        
        const query = repository.select()
                               .eq('tag_id', tagId)
                               .eq('target_id', targetId)
                               .eq('target_type', targetType);
        
        const result = await query.execute();
        
        if (!result.data || result.data.length === 0) {
          return createSuccessResponse(null);
        }
        
        return createSuccessResponse(result.data[0]);
      } catch (err) {
        logger.error(`Error finding tag assignment:`, err);
        return createErrorResponse(`Failed to find tag assignment: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
}
