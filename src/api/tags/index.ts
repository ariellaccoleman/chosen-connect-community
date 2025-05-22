
/**
 * Tags API module - provides functionality for working with tags and tag assignments
 * @module api/tags
 */

// Export legacy API functions for backward compatibility
export * from './assignmentApi';
export * from './entityTagsApi';
export * from './getTagsApi';
export * from './tagEntityTypesApi';
export * from './cacheApi';
export * from './tagsApi';

// Export direct operations from tagCrudApi
export { findOrCreateTag } from './tagCrudApi';

// Export new repository and service layers
export * from './repository';
export * from './services';

// Re-export the core tag operations using the new repository pattern
import { createTagService } from './services/TagService';
import { createTagAssignmentService } from './services/TagAssignmentService';

// Create singleton instances of services
const tagService = createTagService();
const tagAssignmentService = createTagAssignmentService();

// Export main operations through the service layer
export const getAll = tagService.getAllTags.bind(tagService);
export const getById = tagService.getTagById.bind(tagService);
export const createTag = tagService.createTag.bind(tagService);
export const updateTag = tagService.updateTag.bind(tagService);
export const deleteTag = tagService.deleteTag.bind(tagService);

// Export assignment operations
export const getEntityTags = tagAssignmentService.getTagsForEntity.bind(tagAssignmentService);
export const getEntitiesWithTag = tagAssignmentService.getEntitiesWithTag.bind(tagAssignmentService);
export const assignTag = tagAssignmentService.assignTag.bind(tagAssignmentService);
export const removeTagAssignment = tagAssignmentService.removeTagAssignment.bind(tagAssignmentService);
