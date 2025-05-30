
/**
 * Export all tag-related hooks - Factory pattern only
 */

// Export factory-based hooks as primary exports
export * from './useTagFactoryHooks';

// Export existing hooks for specific use cases
export * from './useTagQuery';
export * from './useTagAssignmentRelationshipHooks';
export * from './useTagAssignments';

// Note: useTagCrudMutations and useTagAssignmentMutations are already exported from useTagFactoryHooks
// Removed duplicate exports from useTagMutations to resolve ambiguity
