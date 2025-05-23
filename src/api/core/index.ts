
/**
 * Core API module exports
 */

// Factory pattern
export * from './factory/apiFactory';
// Export specific operations to avoid name conflicts
export { 
  createCoreOperations,
  createQueryOperations,
  createMutationOperations 
} from './factory/operations';
export * from './factory/types';

// Repository pattern
export * from './repository/index';
export * from './repository/repositoryFactory';
export * from './repository/DataRepository';
export * from './repository/BaseRepository';
export * from './repository/EntityRepository';

// Error handling
export {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  // Avoid re-exporting ApiResponse here to prevent duplicate
} from './errorHandler';

// API Client
export * from './apiClient';

// Types
export * from './types';
