
/**
 * Tag Assignment Repository
 * Repository implementation for managing tag assignments
 */
import { RepositoryQuery } from "@/api/core/repository";
import { createSupabaseRepository } from "@/api/core/repository/repositoryFactory";
import { supabase } from "@/integrations/supabase/client";
import { TagAssignment } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";

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
        const result = await repository.findAll();
        return result.data || [];
      } catch (err) {
        logger.error("Error fetching all tag assignments:", err);
        return [];
      }
    },
    
    async getTagAssignmentsByTagId(tagId: string): Promise<TagAssignment[]> {
      try {
        const result = await repository.findMany({ 
          filters: { tag_id: tagId } 
        });
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
        const result = await repository.findMany({ 
          filters: { 
            target_id: entityId,
            target_type: entityType
          },
          query: `*, tag:tags(*)` 
        });
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
        const filters: Record<string, any> = { tag_id: tagId };
        
        if (entityType) {
          filters.target_type = entityType;
        }
        
        const result = await repository.findMany({ filters });
        
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
        const result = await repository.create(data);
        
        if (!result.data) {
          throw new Error("Failed to create tag assignment");
        }
        
        return result.data;
      } catch (err) {
        logger.error("Error creating tag assignment:", err);
        throw err;
      }
    },
    
    async deleteTagAssignment(id: string): Promise<void> {
      try {
        await repository.delete(id);
      } catch (err) {
        logger.error(`Error deleting tag assignment ${id}:`, err);
        throw err;
      }
    },
    
    async deleteTagAssignmentsForTag(tagId: string): Promise<void> {
      try {
        await repository.deleteWhere({ tag_id: tagId });
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
        await repository.deleteWhere({ 
          target_id: entityId,
          target_type: entityType
        });
      } catch (err) {
        logger.error(`Error deleting tag assignments for entity ${entityId}:`, err);
        throw err;
      }
    }
  };
}
