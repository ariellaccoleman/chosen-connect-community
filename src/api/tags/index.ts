
/**
 * Tags API module - provides functionality for working with tags and tag assignments
 * @module api/tags
 */

// Re-export all tag-related API functions
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './getTagsApi';
export * from './tagEntityTypesApi';
export * from './cacheApi';
export * from './tagsApi';

// Export functions from tagCrudApi with renamed imports to avoid conflicts
// since similar names are exported from tagsApi
export { 
  findOrCreateTag,
} from './tagCrudApi';

// No need to redefine tagsApi here since we're exporting from tagsApi.ts
