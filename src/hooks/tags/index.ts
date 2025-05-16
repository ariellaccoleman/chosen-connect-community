
/**
 * Export all tag-related hooks
 */
export * from './useTagsHooks';
export { useTagFilter } from '../useTagFilter';
export { useEntityTags } from '../useTagQueries';

// Re-export hooks from tag module for backwards compatibility
export { 
  useTagAssignmentMutations,
  useTagFindOrCreate,
  useTagEntityType,
  useTagBasicCrud,
  useTagCrudMutations as useTagMutations
} from '../tag';

// Add re-export for create tag
export const useCreateTag = () => {
  const { createTag } = useTagCrudMutations();
  return createTag;
};
