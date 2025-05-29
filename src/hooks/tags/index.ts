
/**
 * Export all tag-related hooks - Updated to use factory pattern
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

// Export deprecated hooks with warning names
export { 
  useSelectionTags as useSelectionTagsDeprecated,
  useFilterByTag as useFilterByTagDeprecated,
  useEntityTags as useEntityTagsDeprecated,
  useTagAssignmentMutations as useTagAssignmentMutationsDeprecated
} from './useTagHooks';

// For backward compatibility with existing code
export { useSelectionTags as useTags } from './useTagLegacy';
