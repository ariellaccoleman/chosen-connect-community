
/**
 * Tag Assignment Repository
 * Repository implementation for managing tag assignments
 */
import { createSupabaseRepository } from "@/api/core/repository/repositoryFactory";
import { supabase } from "@/integrations/supabase/client";
import { TagAssignment } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";
import { ApiResponse, createSuccessResponse } from "@/api/core/errorHandler";

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
  getTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Get entities with a specific tag
   */
  getEntitiesWithTag(tagId: string, entityType?: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Create a tag assignment
   */
  createTagAssignment(data: Partial<TagAssignment>): Promise<TagAssignment>;
  
  /**
   * Delete a tag assignment
   */
  deleteTagAssignment(id: string): Promise<void>;
  
  /**
   * Delete tag assignments for a tag
   */
  deleteTagAssignmentsForTag(tagId: string): Promise<void>;
  
  /**
   * Delete tag assignments for an entity
   */
  deleteTagAssignmentsForEntity(entityId: string, entityType: EntityType): Promise<void>;
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
      entityId: string, 
      entityType: EntityType
    ): Promise<TagAssignment[]> {
      try {
        const query = repository.select(`*, tag:tags(*)`)
                               .eq('target_id', entityId)
                               .eq('target_type', entityType);
        const result = await query.execute();
        return result.data || [];
      } catch (err) {
        logger.error(`Error fetching tag assignments for entity ${entityId}:`, err);
        return [];
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
    ): Promise<TagAssignment> {
      try {
        const result = await repository.insert(data).execute();
        
        if (!result.data) {
          throw new Error("Failed to create tag assignment");
        }
        
        return result.data[0];
      } catch (err) {
        logger.error("Error creating tag assignment:", err);
        throw err;
      }
    },
    
    async deleteTagAssignment(id: string): Promise<void> {
      try {
        await repository.delete().eq('id', id).execute();
      } catch (err) {
        logger.error(`Error deleting tag assignment ${id}:`, err);
        throw err;
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
    }
  };
}
