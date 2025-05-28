
/**
 * Tag API Factory
 * Main entry point for tag API operations
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { tagCoreOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

// Re-export core operations as the main API
export const extendedTagApi = tagCoreOperations;
export const tagAssignmentApi = tagAssignmentCoreOperations;

// Export the base API for backward compatibility
export const tagApi = extendedTagApi;

// Factory functions for creating API instances
export function createTagApiFactory(client?: SupabaseClient) {
  return extendedTagApi;
}

export function createTagAssignmentApiFactory(client?: SupabaseClient) {
  return tagAssignmentApi;
}

// Re-export all legacy compatibility functions
export * from './legacyCompatibilityFunctions';
