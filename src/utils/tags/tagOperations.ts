
import { getTags, getFilterTags, getSelectionTags } from "@/api/tags";
import { Tag } from "./types";

// Fetch tags for filtering (showing assigned tags only)
export const fetchFilterTags = async (options: {
  type?: string;
  isPublic?: boolean;
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
  isPublic?: boolean;
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

// Create a new tag
export const createTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
  try {
    const { name, description, type, is_public, created_by } = tagData;
    
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        type,
        is_public,
        created_by
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create tag: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating tag:", error);
    return null;
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
