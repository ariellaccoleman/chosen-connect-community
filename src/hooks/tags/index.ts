
/**
 * Export all tag-related hooks
 */
// Import and re-export hooks from the tags module
export * from './useTagsHooks';
export * from './useTagQueryHooks';
export * from './useTagCrudHooks';
export * from './useTagAssignmentHooks';

// For backward compatibility
export { useSelectionTags as useTags } from './useTagQueryHooks';
