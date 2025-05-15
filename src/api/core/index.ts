
/**
 * Core API module exports
 */

// Factory pattern
export * from './factory/apiFactory';
export * from './factory/operations';
export * from './factory/types';

// Repository pattern
export * from './repository/repositoryFactory';

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
