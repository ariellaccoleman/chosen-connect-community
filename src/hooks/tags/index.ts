
/**
 * Export all tag-related hooks
 */
// Export all hooks from their dedicated modules
export * from './useTagQuery';
export * from './useTagMutations';
export * from './useTagAssignments';
export * from './useTagHooks';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagQuery';

// Re-export with namespaced names to avoid conflicts
export { useTagCrudMutations as useTagCrudOperations } from './useTagHooks';
export { useTagAssignmentMutations as useTagAssignmentOperations } from './useTagHooks';
