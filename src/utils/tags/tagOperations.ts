
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "./types";
import { logger } from "../logger";
import { handleError } from "../errorUtils";
import { 
  getFilterTags,
  getSelectionTags,
  getEntityTags as getEntityTagsApi,
  createTag as createTagApi,
  updateTag as updateTagApi,
  deleteTag as deleteTagApi,
  assignTag as assignTagApi,
  removeTagAssignment as removeTagAssignmentApi
} from "@/api/tags";

/**
 * Fetch tags for filtering purposes
 */
export const fetchFilterTags = async (options: {
  type?: string;
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
} = {}): Promise<Tag[]> => {
  try {
    const { data, error } = await getFilterTags(options);
    
    if (error) {
      handleError(error, "Error fetching filter tags");
      return [];
    }
    
    return data || [];
  } catch (error) {
    handleError(error, "Error in fetchFilterTags");
    return [];
  }
};

/**
 * Fetch tags for selection purposes (typeahead, selector components)
 */
export const fetchSelectionTags = async (options: {
  type?: string;
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
} = {}): Promise<Tag[]> => {
  try {
    const { data, error } = await getSelectionTags(options);
    
    if (error) {
      handleError(error, "Error fetching selection tags");
      return [];
    }
    
    return data || [];
  } catch (error) {
    handleError(error, "Error in fetchSelectionTags");
    return [];
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use fetchFilterTags or fetchSelectionTags instead
 */
export const fetchTags = fetchSelectionTags;

/**
 * Fetch tags assigned to a specific entity
 */
export const fetchEntityTags = async (entityId: string, entityType: "person" | "organization") => {
  try {
    const { data, error } = await getEntityTagsApi(entityId, entityType);
    
    if (error) {
      handleError(error, "Error fetching entity tags");
      return [];
    }
    
    return data || [];
  } catch (error) {
    handleError(error, "Error in fetchEntityTags");
    return [];
  }
};

/**
 * Create a new tag
 */
export const createTag = async (tagData: Partial<Tag>) => {
  try {
    const { data, error } = await createTagApi(tagData);
    
    if (error) {
      handleError(error, "Error creating tag");
      return null;
    }
    
    return data;
  } catch (error) {
    handleError(error, "Error in createTag");
    return null;
  }
};

/**
 * Update an existing tag
 */
export const updateTag = async (tagId: string, updates: Partial<Tag>) => {
  try {
    const { data, error } = await updateTagApi(tagId, updates);
    
    if (error) {
      handleError(error, "Error updating tag");
      return null;
    }
    
    return data;
  } catch (error) {
    handleError(error, "Error in updateTag");
    return null;
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId: string) => {
  try {
    const { data, error } = await deleteTagApi(tagId);
    
    if (error) {
      handleError(error, "Error deleting tag");
      return false;
    }
    
    return true;
  } catch (error) {
    handleError(error, "Error in deleteTag");
    return false;
  }
};

/**
 * Assign a tag to an entity
 */
export const assignTag = async (tagId: string, entityId: string, entityType: "person" | "organization") => {
  try {
    const { data, error } = await assignTagApi(tagId, entityId, entityType);
    
    if (error) {
      handleError(error, "Error assigning tag");
      return null;
    }
    
    return data;
  } catch (error) {
    handleError(error, "Error in assignTag");
    return null;
  }
};

/**
 * Remove a tag assignment
 */
export const removeTagAssignment = async (assignmentId: string) => {
  try {
    const { data, error } = await removeTagAssignmentApi(assignmentId);
    
    if (error) {
      handleError(error, "Error removing tag assignment");
      return false;
    }
    
    return true;
  } catch (error) {
    handleError(error, "Error in removeTagAssignment");
    return false;
  }
};
