/**
 * Tag Entity Type Repository
 * Repository implementation for managing tag entity type associations
 */
import { createSupabaseRepository } from "@/api/core/repository/repositoryFactory";
import { supabase } from "@/integrations/supabase/client";
import { TagEntityType } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "@/api/core/errorHandler";

/**
 * Tag entity type repository interface
 */
export interface TagEntityTypeRepository {
  /**
   * Get entity types for a tag
   */
  getEntityTypesByTagId(tagId: string): Promise<ApiResponse<string[]>>;
  
  /**
   * Associate a tag with an entity type
   */
  associateTagWithEntityType(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>>;
  
  /**
   * Remove tag entity type association
   */
  removeTagEntityTypeAssociation(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>>;
}

/**
 * Create a tag entity type repository
 * @returns TagEntityTypeRepository instance
 */
export function createTagEntityTypeRepository(providedClient?: any): TagEntityTypeRepository {
  const client = providedClient || supabase;
  const repository = createSupabaseRepository<TagEntityType>("tag_entity_types", client);
  
  return {
    async getEntityTypesByTagId(tagId: string): Promise<ApiResponse<string[]>> {
      try {
        if (!tagId) {
          return createSuccessResponse([]);
        }
        
        const { data, error } = await client
          .from('tag_entity_types')
          .select('entity_type')
          .eq('tag_id', tagId);
        
        if (error) {
          logger.error(`Error fetching entity types for tag ${tagId}:`, error);
          return createSuccessResponse([]);
        }
        
        const entityTypes = data.map(item => item.entity_type);
        return createSuccessResponse(entityTypes);
      } catch (error) {
        logger.error(`Error in getEntityTypesByTagId:`, error);
        return createSuccessResponse([]);
      }
    },
    
    async associateTagWithEntityType(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
      try {
        if (!tagId || !entityType || !isValidEntityType(entityType)) {
          return createErrorResponse('Missing required parameters or invalid entity type');
        }
        
        // Check if the association already exists
        const { data: existingData, error: existingError } = await client
          .from('tag_entity_types')
          .select('*')
          .eq('tag_id', tagId)
          .eq('entity_type', entityType);
        
        if (existingError) {
          logger.error(`Error checking existing association:`, existingError);
          return createErrorResponse(existingError);
        }
        
        if (existingData && existingData.length > 0) {
          // Association already exists, return success
          return createSuccessResponse(true);
        }
        
        const { data, error } = await client
          .from('tag_entity_types')
          .insert([{ tag_id: tagId, entity_type: entityType }]);
        
        if (error) {
          logger.error(`Error associating tag ${tagId} with entity type ${entityType}:`, error);
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        logger.error(`Error in associateTagWithEntityType:`, error);
        return createErrorResponse(error);
      }
    },
    
    async removeTagEntityTypeAssociation(tagId: string, entityType: EntityType): Promise<ApiResponse<boolean>> {
      try {
        if (!tagId || !entityType || !isValidEntityType(entityType)) {
          return createErrorResponse('Missing required parameters or invalid entity type');
        }
        
        const { error } = await client
          .from('tag_entity_types')
          .delete()
          .eq('tag_id', tagId)
          .eq('entity_type', entityType);
        
        if (error) {
          logger.error(`Error removing tag ${tagId} association with entity type ${entityType}:`, error);
          return createErrorResponse(error);
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        logger.error(`Error in removeTagEntityTypeAssociation:`, error);
        return createErrorResponse(error);
      }
    }
  };
}
