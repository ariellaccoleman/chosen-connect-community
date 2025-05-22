
/**
 * Tag Entity Type Repository
 * Repository implementation for managing tag entity types
 */
import { DataRepository } from "@/api/core/repository";
import { supabase } from "@/integrations/supabase/client";
import { TagEntityType } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";

/**
 * Tag entity type repository interface
 */
export interface TagEntityTypeRepository {
  /**
   * Get all tag entity types
   */
  getAllTagEntityTypes(): Promise<TagEntityType[]>;
  
  /**
   * Get tag entity types by tag ID
   */
  getTagEntityTypesByTagId(tagId: string): Promise<TagEntityType[]>;
  
  /**
   * Get tag entity types by entity type
   */
  getTagEntityTypesByEntityType(entityType: EntityType): Promise<TagEntityType[]>;
  
  /**
   * Check if a tag is allowed for an entity type
   */
  isTagAllowedForEntityType(tagId: string, entityType: EntityType): Promise<boolean>;
  
  /**
   * Create tag entity type
   */
  createTagEntityType(data: Partial<TagEntityType>): Promise<TagEntityType>;
  
  /**
   * Delete tag entity type
   */
  deleteTagEntityType(id: string): Promise<void>;
  
  /**
   * Delete all entity types for a tag
   */
  deleteEntityTypesForTag(tagId: string): Promise<void>;
}

/**
 * Create a tag entity type repository
 * @returns TagEntityTypeRepository instance
 */
export function createTagEntityTypeRepository(): TagEntityTypeRepository {
  const repository = new DataRepository<TagEntityType>("tag_entity_types", supabase);
  
  return {
    async getAllTagEntityTypes(): Promise<TagEntityType[]> {
      try {
        const result = await repository.findAll();
        return result.data || [];
      } catch (err) {
        logger.error("Error fetching all tag entity types:", err);
        return [];
      }
    },
    
    async getTagEntityTypesByTagId(tagId: string): Promise<TagEntityType[]> {
      try {
        const result = await repository.findMany({ 
          filters: { tag_id: tagId } 
        });
        return result.data || [];
      } catch (err) {
        logger.error(`Error fetching entity types for tag ${tagId}:`, err);
        return [];
      }
    },
    
    async getTagEntityTypesByEntityType(entityType: EntityType): Promise<TagEntityType[]> {
      try {
        const result = await repository.findMany({ 
          filters: { entity_type: entityType } 
        });
        
        if (!result.data) {
          logger.warn(`No tag entity types found for entity type ${entityType}`);
          return [];
        }
        
        return result.data;
      } catch (err) {
        logger.error(`Error fetching tag entity types for entity type ${entityType}:`, err);
        return [];
      }
    },
    
    async isTagAllowedForEntityType(tagId: string, entityType: EntityType): Promise<boolean> {
      try {
        const result = await repository.findOne({
          filters: {
            tag_id: tagId,
            entity_type: entityType
          }
        });
        
        // If we find a record, the tag is allowed for this entity type
        return !!result.data;
      } catch (err) {
        logger.error(`Error checking if tag ${tagId} is allowed for entity type ${entityType}:`, err);
        return false;
      }
    },
    
    async createTagEntityType(data: Partial<TagEntityType>): Promise<TagEntityType> {
      try {
        const result = await repository.create(data);
        
        if (!result.data) {
          throw new Error("Failed to create tag entity type");
        }
        
        return result.data;
      } catch (err) {
        logger.error("Error creating tag entity type:", err);
        throw err;
      }
    },
    
    async deleteTagEntityType(id: string): Promise<void> {
      try {
        await repository.delete(id);
      } catch (err) {
        logger.error(`Error deleting tag entity type ${id}:`, err);
        throw err;
      }
    },
    
    async deleteEntityTypesForTag(tagId: string): Promise<void> {
      try {
        await repository.deleteWhere({ tag_id: tagId });
      } catch (err) {
        logger.error(`Error deleting entity types for tag ${tagId}:`, err);
        throw err;
      }
    }
  };
}
