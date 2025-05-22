
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

// Export renamed imports from tagApiFactory to prevent name conflicts
export { 
  tagsApi as tagsApiFactory,
  getAllTags as getAllTagsFromFactory,
  getTagById as getTagByIdFromFactory,
  getTagsByIds as getTagsByIdsFromFactory,
  createTag as createTagFromFactory,
  updateTag as updateTagFromFactory,
  deleteTag as deleteTagFromFactory,
  batchCreateTags as batchCreateTagsFromFactory,
  batchUpdateTags as batchUpdateTagsFromFactory,
  batchDeleteTags as batchDeleteTagsFromFactory,
  getAllTagsWithEntityTypes,
  getAllFilteredEntityTags
} from './tagApiFactory';

// Export renamed imports from tagEntityTypesApiFactory to prevent name conflicts
export {
  tagEntityTypesApi,
  getAllTagEntityTypes,
  getTagEntityTypeById,
  createTagEntityType,
  deleteTagEntityType,
  getEntityTypesForTag,
  updateTagEntityType as updateTagEntityTypeFromFactory
} from './tagEntityTypesApiFactory';

// Export renamed imports from tagAssignmentsApiFactory to prevent name conflicts
export {
  tagAssignmentsApi,
  getAllTagAssignments,
  getTagAssignmentById,
  createTagAssignment,
  deleteTagAssignment,
  getAllEntityTagAssignments,
  getEntityTagAssignments,
  assignTag as assignTagFromFactory,
  removeTagAssignment as removeTagAssignmentFromFactory
} from './tagAssignmentsApiFactory';

// Export functions from tagCrudApi with renamed imports to avoid conflicts
export { 
  findOrCreateTag,
} from './tagCrudApi';
