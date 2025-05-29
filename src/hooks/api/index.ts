
/**
 * Authentication-aware API hooks
 * These hooks replace static imports of API clients to ensure proper authentication context
 */

export * from './useTagApi';
export * from './useTagAssignmentApi';
export * from './useOrganizationApi';
export * from './usePersonApi';

// Re-export for convenience
export { useTagApi, useAuthenticatedTagApi } from './useTagApi';
export { useTagAssignmentApi, useAuthenticatedTagAssignmentApi } from './useTagAssignmentApi';
export { useOrganizationApi, useAuthenticatedOrganizationApi } from './useOrganizationApi';
export { usePersonApi, useAuthenticatedPersonApi } from './usePersonApi';
