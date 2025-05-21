
import { createApiFactory } from '@/api/core/factory';
import { Tag } from '@/utils/tags/types';
import { createTagRepository, createTagEntityTypesViewRepository, createFilteredEntityTagsViewRepository } from './repositories';
import { logger } from '@/utils/logger';

/**
 * Create API operations for tags using the factory pattern
 */
export const tagsApi = createApiFactory<Tag, string, Partial<Tag>, Partial<Tag>, 'tags'>(
  {
    tableName: 'tags',
    entityName: 'tag',
    defaultOrderBy: 'name',
    repository: createTagRepository(),
    transformResponse: (data) => ({
      id: data.id,
      name: data.name,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      entity_types: data.entity_types || []
    }),
    transformRequest: (data) => {
      const transformed: Record<string, any> = {};
      if (data.name !== undefined) transformed.name = data.name;
      if (data.description !== undefined) transformed.description = data.description;
      if (data.created_by !== undefined) transformed.created_by = data.created_by;
      return transformed;
    },
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: true
  }
);

/**
 * Create API operations for the tag entity types view
 */
export const tagEntityTypesViewApi = createApiFactory<Tag, string, never, never, 'all_tags_with_entity_types_view'>(
  {
    tableName: 'all_tags_with_entity_types_view',
    entityName: 'tag view',
    defaultOrderBy: 'name',
    repository: createTagEntityTypesViewRepository(),
    useQueryOperations: true,
    useMutationOperations: false,
    useBatchOperations: false
  }
);

/**
 * Create API operations for the filtered entity tags view
 */
export const filteredEntityTagsViewApi = createApiFactory<Tag, string, never, never, 'filtered_entity_tags_view'>(
  {
    tableName: 'filtered_entity_tags_view',
    entityName: 'filtered tag',
    defaultOrderBy: 'name',
    repository: createFilteredEntityTagsViewRepository(),
    useQueryOperations: true,
    useMutationOperations: false,
    useBatchOperations: false
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

// Extract operations from view factories
export const {
  getAll: getAllTagsWithEntityTypes
} = tagEntityTypesViewApi;

export const {
  getAll: getAllFilteredEntityTags
} = filteredEntityTagsViewApi;
