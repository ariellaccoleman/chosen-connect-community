
/**
 * Tags API module - provides functionality for working with tags and tag assignments
 * @module api/tags
 */

// Export from getTagsApi without ambiguity
export { 
  getSelectionTags as getTags,
  getFilterTags
} from './getTagsApi';

// Export assignment APIs
export {
  assignTag,
  removeTagAssignment
} from './assignmentApi';

// Export entity types API from the factory 
export { 
  getEntityTypesForTag,
  getAllTagEntityTypes,
  createTagEntityType,
  getTagEntityTypeById,
  deleteTagEntityType,
  updateTagEntityType
} from './tagEntityTypesApiFactory';

// Export from updateEntityTypeFactory without ambiguity
export { 
  updateTagEntityTypeFromFactory
} from './tagEntityTypesApiFactory';

// Export tag factory APIs
export { 
  getAllTagsWithEntityTypes,
  getAllFilteredEntityTags 
} from './tagApiFactory';

// Export tag assignments factory APIs
export {
  getAllEntityTagAssignments,
  getEntityTagAssignments
} from './tagAssignmentsApiFactory';

// Export cache APIs
export * from './cacheApi';

// Export tag CRUD APIs
export { 
  createTag,
  updateTag,
  deleteTag
} from './tagCrudApi';
