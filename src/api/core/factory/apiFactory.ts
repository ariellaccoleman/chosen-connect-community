
/**
 * Main API Factory - Provides unified access to all factory types
 * This file serves as the main entry point and maintains backward compatibility
 */

// Export all factory functions
export { createStandardApiFactory, createApiOperations } from './standardApiFactory';
export { createRelationshipApiFactory } from './relationshipApiFactory';
export { createViewApiFactory } from './viewApiFactory';

// Export all types
export * from './apiFactoryTypes';
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
  ViewFactoryOptions,
  ViewOperations,
  ApiOperations,
  RelationshipApiOperations
} from './types';

// Maintain backward compatibility - export the standard factory as the default
export { createStandardApiFactory as createApiFactory } from './standardApiFactory';
