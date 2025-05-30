
/**
 * Export all tag utility functions
 */
export * from './tagAssignments';
export * from './tagDisplay';
export * from './tagOperations';
export * from './types';

// Re-export the moved functions from the API layer
export { 
  getTagEntityTypes,
  isTagAssociatedWithEntityType,
  getTagEntityTypeAssociations
} from '@/api/tags/tagEntityTypeOperations';

export { 
  fixTagEntityAssociations 
} from '@/api/tags/tagEntityTypeFixes';
