
import { createApiOperations } from '../core/apiFactory';
import { Tag, TagInsert, TagUpdate } from '@/types/tag';

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
