
import { createApiFactory } from '../core/factory/apiFactory';
import { Tag } from '@/types';

/**
 * Create API operations for tags using the factory pattern
 */
export const tagsApi = createApiFactory<Tag, string, Partial<Tag>, Partial<Tag>, 'tags'>(
  {
    tableName: 'tags',
    entityName: 'tag',
    defaultOrderBy: 'name',
    transformResponse: (data) => ({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by
    }),
    transformRequest: (data) => {
      const transformed: Record<string, any> = {};
      if (data.name !== undefined) transformed.name = data.name;
      if (data.description !== undefined) transformed.description = data.description;
      if (data.type !== undefined) transformed.type = data.type;
      if (data.createdBy !== undefined) transformed.created_by = data.createdBy;
      return transformed;
    },
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: true
  }
);

// Extract individual operations for direct usage
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
} = tagsApi;
