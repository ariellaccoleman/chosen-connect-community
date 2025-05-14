
/**
 * Tag utility functions
 * Central export point for tag utilities
 */

export * from './cacheUtils';
// Re-export everything from tagAssignments except fetchEntityTags to avoid conflict
import { assignTag, removeTagAssignment } from './tagAssignments';
export { assignTag, removeTagAssignment };

export * from './tagDisplay';
export * from './tagEntityTypes';
export * from './tagOperations';
export * from './types';
