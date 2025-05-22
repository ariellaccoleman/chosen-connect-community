
/**
 * Export all tag-related hooks
 */
// Export all hooks from their dedicated modules
export * from './useTagQuery';
export * from './useTagMutations';
export * from './useTagAssignments';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagQuery';
