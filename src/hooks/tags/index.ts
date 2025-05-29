
/**
 * Export all tag-related hooks - Updated to use factory pattern
 */

// Export factory-based hooks to prevent direct repository instantiation
export * from './useTagFactoryHooks';

// Export existing hooks for backward compatibility with renamed exports to avoid conflicts
export * from './useTagQuery';
export { 
  useTagCrudMutations as useTagCrudMutationsLegacy
} from './useTagMutations';
export { 
  useTagAssignmentMutations as useTagAssignmentOperationsLegacy 
} from './useTagAssignments';

// Export from relationship hooks
export * from './useTagAssignmentRelationshipHooks';

// Export from useTagHooks with unique names to avoid conflicts
// Note: These are now deprecated in favor of factory-based hooks
export { 
  useSelectionTags as useSelectionTagsLegacy,
  useFilterByTag as useFilterByTagLegacy
} from './useTagHooks';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagLegacy';
