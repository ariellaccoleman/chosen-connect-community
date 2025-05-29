
/**
 * Export tag API factories - Updated for ApiOperations compliance
 */
export { 
  createTagApiFactory,
  createTagAssignmentApiFactory,
  createTagApi,
  createTagAssignmentApi,
  // Extended factories with full business operations
  createExtendedTagApi,
  createExtendedTagAssignmentApi,
  // DEPRECATED: Will be removed in next phase
  tagApi,
  tagAssignmentApi
} from './tagApiFactory';
