import { 
  getSelectionTags, 
  getFilterTags 
} from "@/api/tags/getTagsApi"; 
import { createTag as apiCreateTag, findOrCreateTag as apiFindOrCreateTag } from "@/api/tags/tagCrudApi"; 
import { updateTagEntityType as apiUpdateTagEntityType } from "@/api/tags/tagEntityTypesApi";
import { Tag } from "./types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
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

// Find or create a tag - entityType is now required
export const findOrCreateTag = async (tagData: Partial<Tag>, entityType: EntityType | string): Promise<Tag | null> => {
  try {
    // Validate entity type - this is now required
    if (!entityType || !isValidEntityTypeInRegistry(entityType)) {
      logger.error(`Invalid or missing entity type in findOrCreateTag: ${entityType}`);
      throw new Error(`Entity type is required and must be valid`);
    }
    
    // Call the API function that properly uses the apiClient
    const response = await apiFindOrCreateTag(tagData);
    
    if (response.status !== 'success' || !response.data) {
      logger.error("Error finding or creating tag:", response.error);
      return null;
    }
    
    // If entity type is provided, associate it with the tag
    try {
      await updateTagEntityType(response.data.id, entityType);
    } catch (entityTypeError) {
      logger.warn(`Error associating tag with entity type: ${entityTypeError}`);
      // Continue even if this fails
    }
    
    return response.data;
  } catch (error) {
    logger.error("Error finding or creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update tag entity type
export const updateTagEntityType = async (
  tagId: string, 
  entityType: EntityType | string
): Promise<boolean> => {
  try {
    // Validate entity type - this is now required
    if (!entityType || !isValidEntityTypeInRegistry(entityType)) {
      logger.error(`Invalid or missing entity type in updateTagEntityType: ${entityType}`);
      throw new Error(`Entity type is required and must be valid`);
    }
    
    const response = await apiUpdateTagEntityType(tagId, entityType);
    
    if (response.status !== 'success') {
      logger.error("Error updating tag entity type:", response.error);
      return false;
    }
    
    return response.data;
  } catch (error) {
    logger.error("Error updating tag entity type:", error);
    // Return false instead of throwing to avoid breaking the UI
    return false;
  }
};

// Create a new tag - entityType is now required
export const createTag = async (tagData: Partial<Tag>, entityType: EntityType | string): Promise<Tag | null> => {
  try {
    // Validate entity type - this is now required
    if (!entityType || !isValidEntityTypeInRegistry(entityType)) {
      logger.error(`Invalid or missing entity type in createTag: ${entityType}`);
      throw new Error(`Entity type is required and must be valid`);
    }
    
    // Call the API function that properly uses the apiClient
    const response = await apiCreateTag(tagData);
    
    if (response.status !== 'success' || !response.data) {
      logger.error("Error creating tag:", response.error);
      return null;
    }
    
    // Associate it with the specified entity type
    try {
      await updateTagEntityType(response.data.id, entityType);
    } catch (entityTypeError) {
      logger.warn(`Error associating tag with entity type: ${entityTypeError}`);
      // Continue even if this fails
    }
    
    return response.data;
  } catch (error) {
    logger.error("Error creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update an existing tag
export const updateTag = async (
  tagId: string,
  updates: Partial<Tag>
): Promise<Tag | null> => {
  try {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update tag: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error("Error updating tag:", error);
    return null;
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete tag: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    logger.error("Error deleting tag:", error);
    return false;
  }
};
