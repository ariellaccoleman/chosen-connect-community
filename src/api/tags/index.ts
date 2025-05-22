
/**
 * Re-export all tag API functionality
 */
export * from './repository';
export * from './getTagsApi';
export * from './tagCrudApi';
export * from './tagEntityTypesApi';
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './organizationTagsApi';
export * from './cacheApi';
export * from './services';
export * from './invalidateCache';

// Export the factory module
export * from './factory';

// Export the factory-based API, with explicit imports to avoid naming conflicts
import {
  tagApi,
  tagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory
} from './factory/tagApiFactory';

export {
  tagApi,
  tagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory
};

// For backward compatibility, we export the legacy APIs with different names
import * as legacyTagsApi from './tagsApi';

export {
  legacyTagsApi as legacyTagOperations
};
