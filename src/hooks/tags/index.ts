
/**
 * Export all tag-related hooks
 */
// Import and re-export hooks from the previous tag module
export * from './useTagsHooks';

// Import and re-export hooks from the tag module
export { 
  useTagCrudMutations,
  useTagAssignmentMutations,
  useTagFindOrCreate,
  useTagEntityType,
  useTagBasicCrud,
  useTagCreation 
} from '../tag';

// For backward compatibility, keep the old hook name
export { useTagCrudMutations as useTagMutations } from '../tag';

// Re-export tag query hooks from useTagQueryHooks for consolidation
export { 
  useFilterTags, 
  useSelectionTags, 
  useEntityTags 
} from './useTagQueryHooks';

// For backward compatibility
export { useSelectionTags as useTags };
