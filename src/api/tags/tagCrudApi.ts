
import { createApiOperations } from '../core/apiFactory';
import { Tag, TagInsert, TagUpdate } from '@/types/tag';
import { apiClient } from '../core/apiClient';
import { createSuccessResponse } from '../core/errorHandler';

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
export const findOrCreateTag = async (tagData: Partial<TagInsert>): Promise<Tag | null> => {
  if (!tagData.name) {
    throw new Error("Tag name is required");
  }

  return apiClient.query(async (client) => {
    // First check if the tag exists
    const { data: existingTags, error: findError } = await client
      .from('tags')
      .select('*')
      .eq('name', tagData.name)
      .maybeSingle();

    if (findError) throw findError;

    // If tag exists, return it
    if (existingTags) {
      return createSuccessResponse(existingTags as Tag);
    }

    // If not, create a new tag
    const { data: newTag, error: createError } = await client
      .from('tags')
      .insert(tagData)
      .select()
      .single();

    if (createError) throw createError;

    return createSuccessResponse(newTag as Tag);
  });
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
