
import { createApiFactory } from '../core/factory';
import { Tag } from '@/utils/tags/types';
import { createTagEntityTypesViewRepository, createFilteredEntityTagsViewRepository } from './repositories';

/**
 * Create API operations for the tag entity types view
 * Using a type assertion to allow using the view name
 */
export const tagEntityTypesViewApi = createApiFactory<Tag, string, never, never, any>(
  {
    tableName: 'all_tags_with_entity_types_view' as any,
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
 * Using a type assertion to allow using the view name
 */
export const filteredEntityTagsViewApi = createApiFactory<Tag, string, never, never, any>(
  {
    tableName: 'filtered_entity_tags_view' as any,
    entityName: 'filtered tag',
    defaultOrderBy: 'name',
    repository: createFilteredEntityTagsViewRepository(),
    useQueryOperations: true,
    useMutationOperations: false,
    useBatchOperations: false
  }
);

// Export individual operations
export const getAllTagsWithEntityTypes = tagEntityTypesViewApi.getAll;
export const getAllFilteredEntityTags = filteredEntityTagsViewApi.getAll;
