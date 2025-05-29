
/**
 * Hook Factory Module
 * 
 * This module provides the core factory pattern implementation for creating
 * standardized React Query hooks for entities.
 */

// Export the main hook factory function and associated types
export * from './queryHookFactory';
export * from './mutationHooks';
export * from './readHooks';
export * from './batchMutationHooks';
export * from './types';

// Export relationship-specific hook factories
export * from './relationshipHooks';

// Export view-specific hook factories
export * from './viewHookFactory';
