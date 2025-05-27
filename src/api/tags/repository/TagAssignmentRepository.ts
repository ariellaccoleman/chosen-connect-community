/**
 * Tag Assignment Repository
 * Repository implementation for managing tag assignments
 */
import { createSupabaseRepository } from "@/api/core/repository/repositoryFactory";
import { supabase } from "@/integrations/supabase/client";
import { TagAssignment } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "@/api/core/errorHandler";

/**
 * Tag assignment repository interface
 */
export interface TagAssignmentRepository {
  /**
   * Get tag assignments for an entity
   */
  getTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>>;
  
  /**
   * Get entities with a specific tag
   */
  getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Create a new tag assignment
   */
  createTagAssignment(data: Partial<TagAssignment>): Promise<ApiResponse<TagAssignment>>;
  
  /**
   * Delete a tag assignment
   */
  deleteTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>>;
  
  /**
   * Delete all tag assignments for an entity
   */
  deleteTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<void>;
}

/**
 * Create a tag assignment repository
 * @returns TagAssignmentRepository instance
 */
export function createTagAssignmentRepository(providedClient?: any): TagAssignmentRepository {
  const client = providedClient || supabase;
  const repository = createSupabaseRepository<TagAssignment>("tag_assignments", client);
  
  return {
    async getTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>> {
      try {
        if (!isValidEntityType(entityType)) {
          return createErrorResponse(`Invalid entity type: ${entityType}`);
        }
        
        const { data, error } = await client
          .from('tag_assignments')
          .select('*')
          .eq('target_id', entityId)
          .eq('target_type', entityType);
        
        if (error) {
          logger.error(`Error fetching tag assignments for entity ${entityId}:`, error);
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(data || []);
      } catch (error) {
        logger.error(`Error in getTagAssignmentsForEntity:`, error);
        return createErrorResponse(error);
      }
    },
    
    async getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<TagAssignment[]> {
      try {
        let query = client
          .from('tag_assignments')
          .select('*')
          .eq('tag_id', tagId);
        
        if (entityType && isValidEntityType(entityType)) {
          query = query.eq('target_type', entityType);
        }
        
        const { data, error } = await query;
        
        if (error) {
          logger.error(`Error fetching entities with tag ${tagId}:`, error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        logger.error(`Error in getEntitiesWithTag:`, error);
        return [];
      }
    },
    
    async createTagAssignment(data: Partial<TagAssignment>): Promise<ApiResponse<TagAssignment>> {
      try {
        const { data: assignment, error } = await client
          .from('tag_assignments')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          logger.error(`Error creating tag assignment:`, error);
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(assignment);
      } catch (error) {
        logger.error(`Error in createTagAssignment:`, error);
        return createErrorResponse(error);
      }
    },
    
    async deleteTagAssignment(assignmentId: string): Promise<ApiResponse<boolean>> {
      try {
        const { error } = await client
          .from('tag_assignments')
          .delete()
          .eq('id', assignmentId);
        
        if (error) {
          logger.error(`Error deleting tag assignment ${assignmentId}:`, error);
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        logger.error(`Error in deleteTagAssignment:`, error);
        return createErrorResponse(error);
      }
    },
    
    async deleteTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<void> {
      try {
        await client
          .from('tag_assignments')
          .delete()
          .eq('target_id', entityId)
          .eq('target_type', entityType);
      } catch (error) {
        logger.error(`Error deleting tag assignments for entity ${entityId}:`, error);
        throw error;
      }
    }
  };
}
