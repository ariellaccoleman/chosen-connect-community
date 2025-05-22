
/**
 * Export all tag-related hooks
 */
// Export all hooks from their dedicated modules
export * from './useTagQuery';
export * from './useTagMutations';
export * from './useTagAssignments';

// Export from useTagHooks with unique names to avoid conflicts
export { 
  useTagCrudMutations as useTagCrudOperations,
  useTagAssignmentMutations as useTagAssignmentOperations 
} from './useTagHooks';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagLegacy';

