
/**
 * Export all tag-related hooks
 */
// Import and re-export hooks from the consolidated tag hooks module
export * from './useTagHooks';

// For backward compatibility
export { useSelectionTags as useTags } from './useTagHooks';
