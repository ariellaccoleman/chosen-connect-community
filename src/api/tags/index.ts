
/**
 * Tags API module - provides functionality for working with tags and tag assignments
 * @module api/tags
 */

// Re-export all tag-related API functions
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './getTagsApi';
export * from './tagCrudApi';
export * from './tagEntityTypesApi';
export * from './cacheApi';
export * from './tagsApi';

// No need to redefine tagsApi here since we're exporting from tagsApi.ts
