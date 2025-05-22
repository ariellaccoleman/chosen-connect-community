
/**
 * Re-export all tag API functionality
 */
export * from './repository';
export * from './factory';
export * from './getTagsApi';
export * from './tagCrudApi';
export * from './tagEntityTypesApi';
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './organizationTagsApi';
export * from './cacheApi';
export * from './services';
export * from './invalidateCache';

// Export the factory-based API, which re-exports will override the old implementation
export * from './factory/tagApiFactory';

// For backward compatibility, we export the legacy APIs with different names
import * as legacyTagsApi from './tagsApi';
export {
  legacyTagsApi as legacyTagOperations
};
