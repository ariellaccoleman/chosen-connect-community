
/**
 * Re-export all tag API functionality
 * Updated to use simplified structure
 */
export * from './getTagsApi';
export * from './tagCrudApi';
export * from './tagEntityTypesApi';
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './organizationTagsApi';
export * from './cacheApi';
export * from './invalidateCache';

// Export the simplified factory module
export * from './factory';

// Export the main APIs with clear separation
import {
  tagApi,
  tagAssignmentApi,
  extendedTagApi,
  extendedTagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory,
  getAllTags,
  getTagById,
  findTagByName,
  searchTags,
  createTag,
  updateTag,
  deleteTag,
  findOrCreateTag,
  getTagsByEntityType,
  getTagAssignmentsForEntity,
  createTagAssignment,
  deleteTagAssignment
} from './factory/tagApiFactory';

export {
  // Base factory APIs (support client injection)
  tagApi,
  tagAssignmentApi,
  // Extended APIs with business operations
  extendedTagApi,
  extendedTagAssignmentApi,
  // Factory functions
  createTagApiFactory,
  createTagAssignmentApiFactory,
  // Individual function exports (simplified)
  getAllTags,
  getTagById,
  findTagByName,
  searchTags,
  createTag,
  updateTag,
  deleteTag,
  findOrCreateTag,
  getTagsByEntityType,
  getTagAssignmentsForEntity,
  createTagAssignment,
  deleteTagAssignment
};

// For backward compatibility, we export the legacy APIs with different names
import * as legacyTagsApi from './tagsApi';

export {
  legacyTagsApi as legacyTagOperations
};
