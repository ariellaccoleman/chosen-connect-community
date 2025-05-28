
import { 
  getSelectionTags, 
  getFilterTags 
} from "@/api/tags/getTagsApi"; 
import { extendedTagApi } from "@/api/tags/factory/tagApiFactory"; 
import { Tag } from "./types";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { isValidEntityType as isValidEntityTypeInRegistry } from "@/registry";

// Fetch tags for filtering (showing assigned tags only)
export const fetchFilterTags = async (options: {
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType | string;
  skipCache?: boolean;
} = {}): Promise<Tag[]> => {
  try {
    // Validate entity type if provided
    let validOptions = { ...options };
    
    // Convert string to EntityType if needed
    if (validOptions.targetType && !isValidEntityTypeInRegistry(validOptions.targetType)) {
      logger.warn(`Invalid entity type: ${validOptions.targetType}, ignoring`);
      validOptions.targetType = undefined;
    }
    
    logger.debug(`fetchFilterTags: Getting tags for target type: ${validOptions.targetType || 'all'}`);
    
    const response = await getFilterTags(validOptions);
    if (response.status !== 'success' || !response.data) {
      logger.error("Error fetching filter tags:", response.error);
      return [];
    }
    
    logger.debug(`fetchFilterTags: Found ${response.data.length} tags`);
    return response.data;
  } catch (error) {
    logger.error("Error in fetchFilterTags:", error);
    // Return empty array on error to prevent UI from breaking
    return [];
  }
};

// Fetch tags for selection (showing entity-specific tags)
export const fetchSelectionTags = async (options: {
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType | string;
  skipCache?: boolean;
} = {}): Promise<Tag[]> => {
  try {
    // Validate entity type if provided
    let validOptions = { ...options };
    
    // Convert string to EntityType if needed
    if (validOptions.targetType && !isValidEntityTypeInRegistry(validOptions.targetType)) {
      logger.warn(`Invalid entity type: ${validOptions.targetType}, ignoring`);
      validOptions.targetType = undefined;
    }
    
    logger.debug(`fetchSelectionTags: Getting tags for target type: ${validOptions.targetType || 'all'}`);
    
    // Use the new view-based API
    const response = await getSelectionTags(validOptions);
    if (response.status !== 'success' || !response.data) {
      logger.error("Error fetching selection tags:", response.error);
      return [];
    }
    
    logger.debug(`fetchSelectionTags: Found ${response.data.length} tags`);
    return response.data;
  } catch (error) {
    logger.error("Error in fetchSelectionTags:", error);
    // Always return empty array on error to prevent UI from breaking
    return [];
  }
};

// Legacy function - alias to fetchSelectionTags
export const fetchTags = fetchSelectionTags;

// Find or create a tag - now uses the new API with wrapped responses
export const findOrCreateTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
  try {
    // Remove created_by from tagData since the trigger will set it
    const { created_by, ...cleanTagData } = tagData;
    
    // Call the API function that properly uses the apiClient and handle wrapped response
    const response = await extendedTagApi.findOrCreate(cleanTagData);
    if (response.error) {
      logger.error("Error finding or creating tag:", response.error);
      throw response.error;
    }
    
    return response.data || null;
  } catch (error) {
    logger.error("Error finding or creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Create a new tag - now uses the new API with wrapped responses
export const createTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
  try {
    // Remove created_by from tagData since the trigger will set it
    const { created_by, ...cleanTagData } = tagData;
    
    // Call the API function that properly uses the apiClient and handle wrapped response
    const response = await extendedTagApi.create(cleanTagData);
    if (response.error) {
      logger.error("Error creating tag:", response.error);
      throw response.error;
    }
    
    return response.data || null;
  } catch (error) {
    logger.error("Error creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update an existing tag - now uses the new API with wrapped responses
export const updateTag = async (
  tagId: string,
  updates: Partial<Tag>
): Promise<Tag | null> => {
  try {
    logger.debug(`Updating tag ${tagId} with:`, updates);
    
    // Call the API function that properly uses the apiClient and handle wrapped response
    const response = await extendedTagApi.update(tagId, updates);
    if (response.error) {
      logger.error("Error updating tag:", response.error);
      throw response.error;
    }
    
    logger.debug(`Successfully updated tag ${tagId}:`, response.data);
    return response.data || null;
  } catch (error) {
    logger.error("Error updating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Delete a tag - now uses the new API with wrapped responses
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    logger.debug(`Deleting tag ${tagId}`);
    
    // Call the API function that properly uses the apiClient and handle wrapped response
    const response = await extendedTagApi.delete(tagId);
    if (response.error) {
      logger.error("Error deleting tag:", response.error);
      throw response.error;
    }
    
    logger.debug(`Successfully deleted tag ${tagId}`);
    return response.data === true;
  } catch (error) {
    logger.error("Error deleting tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};
