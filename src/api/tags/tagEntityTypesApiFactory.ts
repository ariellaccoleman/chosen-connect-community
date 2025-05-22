
import { createApiFactory } from '@/api/core/factory';
import { TagEntityType } from '@/utils/tags/types';
import { createTagEntityTypesRepository } from './repositories';
import { logger } from '@/utils/logger';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { apiClient } from '@/api/core/apiClient';

/**
 * Create API operations for tag entity types using the factory pattern
 */
export const tagEntityTypesApi = createApiFactory<TagEntityType, string, Partial<TagEntityType>, Partial<TagEntityType>, 'tag_entity_types'>(
  {
    tableName: 'tag_entity_types',
    entityName: 'tag entity type',
    defaultOrderBy: 'entity_type',
    repository: createTagEntityTypesRepository,
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: true
  }
);

// Extract individual operations for direct usage
export const getAllTagEntityTypes = tagEntityTypesApi.getAll;
export const getTagEntityTypeById = tagEntityTypesApi.getById;
export const createTagEntityType = tagEntityTypesApi.create;
export const updateTagEntityType = tagEntityTypesApi.update;
export const deleteTagEntityType = tagEntityTypesApi.delete;

/**
 * Get entity types for a specific tag
 */
export const getEntityTypesForTag = async (tagId: string): Promise<ApiResponse<string[]>> => {
  try {
    logger.debug(`Getting entity types for tag ${tagId}`);
    const response = await getAllTagEntityTypes();
    
    if (response.status !== 'success' || !response.data) {
      return createErrorResponse(response.error);
    }
    
    const entityTypes = response.data
      .filter(entry => entry.tag_id === tagId)
      .map(entry => entry.entity_type);
    
    return createSuccessResponse(entityTypes);
  } catch (error) {
    logger.error("Error getting entity types for tag:", error);
    return createErrorResponse(error);
  }
};

/**
 * Update the entity types for a tag
 * Associates a tag with an entity type, creating the association if it doesn't exist
 */
export const updateTagEntityTypeFromFactory = async (tagId: string, entityType: string): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    try {
      logger.debug(`Associating tag ${tagId} with entity type ${entityType}`);
      
      const { data: existingAssociation, error: checkError } = await client
        .from('tag_entity_types')
        .select('id')
        .eq('tag_id', tagId)
        .eq('entity_type', entityType)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "no rows returned"
        throw checkError;
      }
      
      if (!existingAssociation) {
        // Create new association
        const { error: insertError } = await client
          .from('tag_entity_types')
          .insert({
            tag_id: tagId,
            entity_type: entityType
          });
        
        if (insertError) throw insertError;
      }
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error("Error updating tag entity type:", error);
      return createErrorResponse(error);
    }
  });
};
