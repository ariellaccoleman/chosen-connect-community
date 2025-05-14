
import { getTags, getFilterTags, getSelectionTags } from "@/api/tags";
import { createTag as apiCreateTag, findOrCreateTag as apiFindOrCreateTag } from "@/api/tags/tagCrudApi"; 
import { updateTagEntityType as apiUpdateTagEntityType } from "@/api/tags/tagEntityTypesApi";
import { Tag } from "./types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { TagInsert } from "@/types/tag";

// Fetch tags for filtering (showing assigned tags only)
export const fetchFilterTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType | string;
} = {}): Promise<Tag[]> => {
  try {
    // Validate entity type if provided
    let validOptions = { ...options };
    
    // Convert string to EntityType if needed
    if (validOptions.targetType && !isValidEntityType(validOptions.targetType)) {
      console.warn(`Invalid entity type: ${validOptions.targetType}, ignoring`);
      validOptions.targetType = undefined;
    }
    
    const response = await getFilterTags(validOptions);
    if (response.status !== 'success' || !response.data) {
      console.error("Error fetching filter tags:", response.error);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in fetchFilterTags:", error);
    return [];
  }
};

// Fetch tags for selection (showing entity-specific and general tags)
export const fetchSelectionTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType | string;
  skipCache?: boolean;
} = {}): Promise<Tag[]> => {
  try {
    // Validate entity type if provided
    let validOptions = { ...options };
    
    // Convert string to EntityType if needed
    if (validOptions.targetType && !isValidEntityType(validOptions.targetType)) {
      console.warn(`Invalid entity type: ${validOptions.targetType}, ignoring`);
      validOptions.targetType = undefined;
    }
    
    const response = await getSelectionTags(validOptions);
    if (response.status !== 'success' || !response.data) {
      console.error("Error fetching selection tags:", response.error);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in fetchSelectionTags:", error);
    return [];
  }
};

// Legacy function - alias to fetchSelectionTags
export const fetchTags = fetchSelectionTags;

// Find or create a tag
export const findOrCreateTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
  try {
    // If type is provided as EntityType, convert to string
    if (tagData.type && isValidEntityType(tagData.type)) {
      tagData = { ...tagData, type: tagData.type.toString() };
    }
    
    // Ensure name is provided
    if (!tagData.name) {
      console.error("Tag name is required");
      return null;
    }
    
    // Create a valid TagInsert object from the partial Tag
    const tagInsert: TagInsert = {
      name: tagData.name,
      description: tagData.description || null,
      type: tagData.type || null,
      created_by: tagData.created_by || null
    };
    
    // Call the API function that properly uses the apiClient
    const tag = await apiFindOrCreateTag(tagInsert);
    
    if (!tag) {
      console.error("Error finding or creating tag");
      return null;
    }
    
    return tag;
  } catch (error) {
    console.error("Error finding or creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update tag entity type
export const updateTagEntityType = async (
  tagId: string, 
  entityType: EntityType | string
): Promise<boolean> => {
  try {
    // Validate entity type
    if (!isValidEntityType(entityType)) {
      console.error(`Invalid entity type: ${entityType}`);
      return false;
    }
    
    const response = await apiUpdateTagEntityType(tagId, entityType);
    
    if (response.status !== 'success') {
      console.error("Error updating tag entity type:", response.error);
      return false;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error updating tag entity type:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Create a new tag - Use the API function instead of direct fetch
export const createTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
  try {
    // If type is provided as EntityType, convert to string
    if (tagData.type && isValidEntityType(tagData.type)) {
      tagData = { ...tagData, type: tagData.type.toString() };
    }
    
    // Ensure name is provided
    if (!tagData.name) {
      console.error("Tag name is required");
      return null;
    }
    
    // Create a valid TagInsert object
    const tagInsert: TagInsert = {
      name: tagData.name,
      description: tagData.description || null,
      type: tagData.type || null,
      created_by: tagData.created_by || null
    };
    
    // Call the API function that properly uses the apiClient
    const response = await apiCreateTag(tagInsert);
    
    if (response.status !== 'success' || !response.data) {
      console.error("Error creating tag:", response.error);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update an existing tag
export const updateTag = async (
  tagId: string,
  updates: Partial<Tag>
): Promise<Tag | null> => {
  try {
    // If type is provided as EntityType, convert to string
    if (updates.type && isValidEntityType(updates.type)) {
      updates = { ...updates, type: updates.type.toString() };
    }
    
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
    console.error("Error updating tag:", error);
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
    console.error("Error deleting tag:", error);
    return false;
  }
};
