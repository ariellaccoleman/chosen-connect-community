
import { getTags, getFilterTags, getSelectionTags } from "@/api/tags";
import { createTag as apiCreateTag, findOrCreateTag as apiFindOrCreateTag } from "@/api/tags/tagCrudApi"; 
import { updateTagEntityType as apiUpdateTagEntityType } from "@/api/tags/tagEntityTypesApi";
import { Tag } from "./types";

// Fetch tags for filtering (showing assigned tags only)
export const fetchFilterTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
} = {}): Promise<Tag[]> => {
  try {
    const response = await getFilterTags(options);
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
  targetType?: string;
  skipCache?: boolean;
} = {}): Promise<Tag[]> => {
  try {
    const response = await getSelectionTags(options);
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
    // Call the API function that properly uses the apiClient
    const response = await apiFindOrCreateTag(tagData);
    
    if (response.status !== 'success' || !response.data) {
      console.error("Error finding or creating tag:", response.error);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error finding or creating tag:", error);
    throw error; // Re-throw to let the mutation handler deal with it
  }
};

// Update tag entity type
export const updateTagEntityType = async (tagId: string, entityType: string): Promise<boolean> => {
  try {
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
    // Call the API function that properly uses the apiClient
    const response = await apiCreateTag(tagData);
    
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
