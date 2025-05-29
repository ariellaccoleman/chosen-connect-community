
/**
 * Export all tag-related hooks - Factory pattern only
 */

// Export factory-based hooks as primary exports
export * from './useTagFactoryHooks';

// Export existing hooks for specific use cases
export * from './useTagQuery';
export * from './useTagAssignmentRelationshipHooks';

// Export legacy hooks with clear deprecation naming
export { 
  useTagCrudMutations as useTagCrudMutationsLegacy
} from './useTagMutations';
export { 
  useTagAssignmentMutations as useTagAssignmentOperationsLegacy 
} from './useTagAssignments';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagLegacy';
