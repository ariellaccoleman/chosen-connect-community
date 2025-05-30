
/**
 * Export all tag-related hooks - Factory pattern only
 */

// Export factory-based hooks as primary exports
export * from './useTagFactoryHooks';

// Export existing hooks for specific use cases
export * from './useTagQuery';
export * from './useTagAssignmentRelationshipHooks';
export * from './useTagMutations';
export * from './useTagAssignments';
