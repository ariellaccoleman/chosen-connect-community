
/**
 * Tag Entity Type Repository
 * Repository implementation for managing tag entity types
 */
import { apiClient } from "@/api/core/apiClient";
import { TagEntityType } from "@/utils/tags/types";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "@/api/core/errorHandler";

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
   * Get entity types by tag ID
   */
  getEntityTypesByTagId(tagId?: string): Promise<ApiResponse<string[]>>;
  
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
  
  /**
   * Associate a tag with an entity type if not already associated
   */
  associateTagWithEntityType(tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>>;
  
  /**
   * Remove association between a tag and an entity type
   */
  removeTagEntityTypeAssociation(tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>>;
}

/**
 * Create a tag entity type repository
 * @param providedClient - Optional Supabase client instance
 * @returns TagEntityTypeRepository instance
 */
export function createTagEntityTypeRepository(providedClient?: any): TagEntityTypeRepository {
  
  return {
    async getAllTagEntityTypes(): Promise<TagEntityType[]> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_entity_types')
            .select('*');
          
          if (error) throw error;
          return data || [];
        }, providedClient);
      } catch (err) {
        logger.error("Error fetching all tag entity types:", err);
        return [];
      }
    },
    
    async getTagEntityTypesByTagId(tagId: string): Promise<TagEntityType[]> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_entity_types')
            .select('*')
            .eq('tag_id', tagId);
          
          if (error) throw error;
          return data || [];
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching entity types for tag ${tagId}:`, err);
        return [];
      }
    },
    
    async getEntityTypesByTagId(tagId?: string): Promise<ApiResponse<string[]>> {
      try {
        // Handle undefined or null tagId
        if (!tagId) {
          return createSuccessResponse([]);
        }
        
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_entity_types')
            .select('entity_type')
            .eq('tag_id', tagId);
          
          if (error) throw error;
          
          if (!data) {
            return createSuccessResponse([]);
          }
          
          const entityTypes = data.map(item => item.entity_type);
          return createSuccessResponse(entityTypes);
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching entity types for tag ${tagId}:`, err);
        return createErrorResponse('Failed to get entity types');
      }
    },
    
    async getTagEntityTypesByEntityType(entityType: EntityType): Promise<TagEntityType[]> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_entity_types')
            .select('*')
            .eq('entity_type', entityType);
          
          if (error) throw error;
          
          if (!data) {
            logger.warn(`No tag entity types found for entity type ${entityType}`);
            return [];
          }
          
          return data;
        }, providedClient);
      } catch (err) {
        logger.error(`Error fetching tag entity types for entity type ${entityType}:`, err);
        return [];
      }
    },
    
    async isTagAllowedForEntityType(tagId: string, entityType: EntityType): Promise<boolean> {
      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from('tag_entity_types')
            .select('*')
            .eq('tag_id', tagId)
            .eq('entity_type', entityType);
          
          if (error) throw error;
          
          // If we find a record, the tag is allowed for this entity type
          return data?.length > 0;
        }, providedClient);
      } catch (err) {
        logger.error(`Error checking if tag ${tagId} is allowed for entity type ${entityType}:`, err);
        return false;
      }
    },
    
    async createTagEntityType(data: Partial<TagEntityType>): Promise<TagEntityType> {
      try {
        return await apiClient.query(async (client) => {
          const { data: result, error } = await client
            .from('tag_entity_types')
            .insert(data)
            .select()
            .single();
          
          if (error) throw error;
          if (!result) throw new Error("Failed to create tag entity type");
          
          return result;
        }, providedClient);
      } catch (err) {
        logger.error("Error creating tag entity type:", err);
        throw err;
      }
    },
    
    async deleteTagEntityType(id: string): Promise<void> {
      try {
        await apiClient.query(async (client) => {
          const { error } = await client
            .from('tag_entity_types')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
        }, providedClient);
      } catch (err) {
        logger.error(`Error deleting tag entity type ${id}:`, err);
        throw err;
      }
    },
    
    async deleteEntityTypesForTag(tagId: string): Promise<void> {
      try {
        await apiClient.query(async (client) => {
          const { error } = await client
            .from('tag_entity_types')
            .delete()
            .eq('tag_id', tagId);
          
          if (error) throw error;
        }, providedClient);
      } catch (err) {
        logger.error(`Error deleting entity types for tag ${tagId}:`, err);
        throw err;
      }
    },
    
    async associateTagWithEntityType(tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>> {
      try {
        // Validate parameters
        if (!tagId || !entityType) {
          return createErrorResponse('Missing required parameters');
        }
        
        // Check if association already exists
        const exists = await this.isTagAllowedForEntityType(tagId, entityType);
        
        // If association doesn't exist, create it
        if (!exists) {
          logger.debug(`Creating tag entity type association for tag ${tagId} and entity type ${entityType}`);
          await this.createTagEntityType({
            tag_id: tagId,
            entity_type: entityType
          });
        }
        
        return createSuccessResponse(true);
      } catch (err) {
        logger.error(`Error associating tag ${tagId} with entity type ${entityType}:`, err);
        return createErrorResponse(`Error associating tag with entity type: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    
    async removeTagEntityTypeAssociation(tagId?: string, entityType?: EntityType): Promise<ApiResponse<boolean>> {
      try {
        // Validate parameters
        if (!tagId || !entityType) {
          return createErrorResponse('Missing required parameters');
        }
        
        // Find and delete the association
        const associations = await this.getTagEntityTypesByTagId(tagId);
        const association = associations.find(a => a.entity_type === entityType);
        
        if (association) {
          await this.deleteTagEntityType(association.id);
        }
        
        return createSuccessResponse(true);
      } catch (err) {
        logger.error(`Error removing tag ${tagId} association with entity type ${entityType}:`, err);
        return createErrorResponse(`Error removing tag entity type association: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
}
