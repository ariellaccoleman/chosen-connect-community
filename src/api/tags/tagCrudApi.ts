
import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

/**
 * Find or create a tag with the given name
 * This follows a two-step approach:
 * 1. First try to find a tag with the given name
 * 2. If not found, create a new tag
 */
export const findOrCreateTag = async (tagData: Partial<Tag>): Promise<ApiResponse<Tag>> => {
  return apiClient.query(async (client) => {
    // First attempt to find an existing tag by name
    const { data: existingTag, error: findError } = await client
      .from('tags')
      .select()
      .eq('name', tagData.name)
      .maybeSingle();
    
    // If we found a tag with this name, return it
    if (existingTag && !findError) {
      console.log("Found existing tag:", existingTag);
      return createSuccessResponse(existingTag);
    }
    
    // If no existing tag found, create a new one
    const { data: newTag, error: createError } = await client
      .from('tags')
      .insert({
        name: tagData.name,
        description: tagData.description,
        type: tagData.type,
        created_by: tagData.created_by
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    console.log("Created new tag:", newTag);
    return createSuccessResponse(newTag);
  });
};

/**
 * Create a new tag
 */
export const createTag = async (tagData: Partial<Tag>): Promise<ApiResponse<Tag>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from('tags')
      .insert({
        name: tagData.name,
        description: tagData.description,
        type: tagData.type,
        created_by: tagData.created_by
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  });
};

/**
 * Update an existing tag
 */
export const updateTag = async (
  tagId: string,
  updates: Partial<Tag>
): Promise<ApiResponse<Tag>> => {
  return apiClient.query(async (client) => {
    // Only allow safe properties to be updated
    const { created_by, ...safeUpdates } = updates;
    
    const { data, error } = await client
      .from('tags')
      .update(safeUpdates)
      .eq('id', tagId)
      .select()
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  });
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId: string): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    const { error } = await client
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    if (error) throw error;
    
    return createSuccessResponse(true);
  });
};
