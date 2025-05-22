
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../core/errorHandler";
import { logger } from "@/utils/logger";
import { TagEntityType } from "@/utils/tags/types";
import { createTagEntityTypesRepository } from "./repositories";

/**
 * Create a repository for tag entity type operations
 */
const tagEntityTypesRepo = createTagEntityTypesRepository();

/**
 * Get all tag entity types
 */
export const getAllTagEntityTypes = async (): Promise<ApiResponse<TagEntityType[]>> => {
  try {
    return await tagEntityTypesRepo.getAll();
  } catch (error) {
    logger.error("Error getting all tag entity types:", error);
    return createErrorResponse(error);
  }
};

/**
 * Get tag entity type by ID
 */
export const getTagEntityTypeById = async (id: string): Promise<ApiResponse<TagEntityType>> => {
  try {
    return await tagEntityTypesRepo.getById(id);
  } catch (error) {
    logger.error(`Error getting tag entity type with ID ${id}:`, error);
    return createErrorResponse(error);
  }
};

/**
 * Create a tag entity type
 */
export const createTagEntityType = async (data: Partial<TagEntityType>): Promise<ApiResponse<TagEntityType>> => {
  try {
    return await tagEntityTypesRepo.insert(data);
  } catch (error) {
    logger.error("Error creating tag entity type:", error);
    return createErrorResponse(error);
  }
};

/**
 * Update a tag entity type
 */
export const updateTagEntityType = async (id: string, data: Partial<TagEntityType>): Promise<ApiResponse<TagEntityType>> => {
  try {
    return await tagEntityTypesRepo.update(id, data);
  } catch (error) {
    logger.error(`Error updating tag entity type with ID ${id}:`, error);
    return createErrorResponse(error);
  }
};

/**
 * Delete a tag entity type
 */
export const deleteTagEntityType = async (id: string): Promise<ApiResponse<boolean>> => {
  try {
    return await tagEntityTypesRepo.delete(id);
  } catch (error) {
    logger.error(`Error deleting tag entity type with ID ${id}:`, error);
    return createErrorResponse(error);
  }
};

/**
 * Get entity types for a specific tag
 */
export const getEntityTypesForTag = async (tagId: string): Promise<ApiResponse<string[]>> => {
  return apiClient.query(async (client) => {
    try {
      logger.debug(`Getting entity types for tag ${tagId}`);
      const { data, error } = await client
        .from('tag_entity_types')
        .select('entity_type')
        .eq('tag_id', tagId);
      
      if (error) throw error;
      
      const entityTypes = data.map(entry => entry.entity_type);
      return createSuccessResponse(entityTypes);
    } catch (error) {
      logger.error("Error getting entity types for tag:", error);
      return createErrorResponse(error);
    }
  });
};
