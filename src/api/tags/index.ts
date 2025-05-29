
/**
 * Main tag API exports - simplified structure
 */

// Export the two main APIs
export {
  tagApi,
  tagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory
} from './factory/tagApiFactory';

// Export simplified function interface for direct usage
export {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  findTagByName,
  searchTags,
  findOrCreateTag,
  getTagsByEntityType,
  getTagAssignmentsForEntity,
  createTagAssignment,
  deleteTagAssignment
} from './factory/tagApiFactory';

// Export cache utilities
export * from './cacheApi';
export * from './invalidateCache';

// For backward compatibility with legacy code, export the old tagsApi functions
// These will be removed in a future version
export * from './tagsApi';
