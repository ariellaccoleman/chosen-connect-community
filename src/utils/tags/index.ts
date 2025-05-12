
// Re-export all tag-related functions and types from one central file
export * from './types';
// Export from tagOperations with the new functions
export { 
  fetchFilterTags,
  fetchSelectionTags,
  fetchTags,
  createTag, 
  updateTag, 
  deleteTag
} from './tagOperations';
// Export from tagAssignments
export {
  fetchEntityTags,
  assignTag,
  removeTagAssignment
} from './tagAssignments';
export * from './tagEntityTypes';
export * from './tagDisplay';
export * from './cacheUtils';
