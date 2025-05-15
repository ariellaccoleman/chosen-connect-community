
import { createApiFactory } from '../core/factory/apiFactory';
import { Tag } from '@/types';

// Re-export all tag-related API functions
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './getTagsApi';
export * from './tagCrudApi';
export * from './tagEntityTypesApi';
export * from './cacheApi';
export * from './organizationTagsApi';
export * from './tagsApi'; // Add this export to include all the operations from tagsApi

/**
 * Create API operations for tags
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
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

// Re-export specific API operations
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
