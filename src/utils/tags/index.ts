
// Re-export all tag-related functions and types from one central file
export * from './types';
// Export from tagOperations without the conflicting functions
export { 
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
