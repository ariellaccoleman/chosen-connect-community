
/**
 * Export all tag utility functions
 */
export * from './cacheUtils';
export * from './tagAssignments';
export * from './tagDisplay';
export * from './tagEntityTypes';
export * from './tagOperations';
export * from './types';

// Re-export invalidateTagCache from cacheApi for backward compatibility
export { invalidateTagCache } from '@/api/tags/cacheApi';
