
/**
 * Core API module exports
 */

// Factory pattern
export * from './factory/apiFactory';
// Export specific operations to avoid name conflicts
export { 
  createQueryOperations,
  createMutationOperations 
} from './factory/operations';

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

// Types - import specific types to avoid conflicts
export type { 
  TableNames, 
  ViewNames,
  TableRow,
  ViewRow,
  TableInsert,
  TableUpdate,
  TableColumnName,
  ViewColumnName,
  ApiFactoryOptions,
  RelationshipFactoryOptions,
  ViewFactoryOptions
} from './factory/types';

// Export EnhancedRepositoryType specifically from apiFactoryTypes to avoid conflicts
export type { EnhancedRepositoryType } from './factory/apiFactoryTypes';

