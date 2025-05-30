
/**
 * Main tag API exports - Factory pattern only
 */

// Export the factory APIs and their instances
export {
  tagApi,
  tagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory,
  createExtendedTagApi,
  createExtendedTagAssignmentApi
} from './factory/tagApiFactory';

// Export simplified function interface for direct usage (factory-based)
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

// Export legacy tagsApi functions for backward compatibility
// These will be removed in a future version
export * from './tagsApi';
