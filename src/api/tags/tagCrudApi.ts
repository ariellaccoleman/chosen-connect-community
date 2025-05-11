
import { Tag } from "@/utils/tags";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";

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
        is_public: tagData.is_public,
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
