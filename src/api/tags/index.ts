
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
  createTag,
  updateTag,
  deleteTag,
  findOrCreateTag,
  createTagAssignment,
  deleteTagAssignment
} from './factory/tagApiFactory';
