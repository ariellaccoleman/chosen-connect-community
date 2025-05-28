
/**
 * Tag API Factory - Main entry point using factory configuration
 */
import { extendedTagOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

// Export the factory-based APIs
export const extendedTagApi = extendedTagOperations;
export const tagAssignmentApi = tagAssignmentCoreOperations;
export const tagApi = extendedTagApi; // For backward compatibility

// Factory functions for creating API instances (for consistency with other APIs)
export function createTagApiFactory() {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory() {
  return tagAssignmentApi;
}

// Re-export core operations for direct access if needed
export { tagCoreOperations } from './tagCoreOperations';
