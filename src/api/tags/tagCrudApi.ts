
import { createApiOperations } from '../core/apiFactory';
import { Tag, TagInsert, TagUpdate } from '@/types/tag';
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, ApiResponse } from '../core/errorHandler';

/**
 * Create API operations for the Tags entity
 */
export const tagCrudApi = createApiOperations<Tag, string, TagInsert, TagUpdate>(
  'tag',
  'tags',
  {
    defaultOrderBy: 'name',
    transformResponse: (item) => item as Tag
  }
);

/**
 * Find an existing tag or create a new one if it doesn't exist
 * This operation is commonly needed for tags
 */
export const findOrCreateTag = async (tagData: TagInsert): Promise<Tag | null> => {
  if (!tagData.name) {
    throw new Error("Tag name is required");
  }

  try {
    return await apiClient.query(async (client) => {
      // First check if the tag exists
      const { data: existingTags, error: findError } = await client
        .from('tags')
        .select('*')
        .eq('name', tagData.name)
        .maybeSingle();

      if (findError) throw findError;

      // If tag exists, return it
      if (existingTags) {
        return existingTags as Tag;
      }

      // Ensure name is provided for insert
      if (!tagData.name) {
        throw new Error("Tag name is required");
      }

      // If not, create a new tag
      const { data: newTag, error: createError } = await client
        .from('tags')
        .insert(tagData)
        .select()
        .single();

      if (createError) throw createError;

      return newTag as Tag;
    });
  } catch (error) {
    console.error("Error in findOrCreateTag:", error);
    return null;
  }
};

/**
 * Re-export individual operations for convenient usage
 */
export const {
  getAll: getAllTags,
  getById: getTagById,
  getByIds: getTagsByIds,
  create: createTag,
  update: updateTag,
  delete: deleteTag,
  batchCreate: batchCreateTags,
  batchUpdate: batchUpdateTags,
  batchDelete: batchDeleteTags
} = tagCrudApi;
