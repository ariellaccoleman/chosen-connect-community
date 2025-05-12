
// Re-export all tag-related hooks from here for backward compatibility
export {
  useFilterTags,
  useSelectionTags,
  useTags,
  useEntityTags
} from './useTagQueries';

export {
  useTagMutations,
  useTagAssignmentMutations
} from './useTagMutations';

export { invalidateTagCache } from './useTagCache';
