
import { useMemo } from 'react';
import { createExtendedTagAssignmentApi } from '@/api/tags/factory/tagApiFactory';

/**
 * Authentication-aware hook for tag assignment API operations
 * Replaces static imports of tagAssignmentApi to ensure proper authentication context
 */
export const useTagAssignmentApi = (testClient?: any) => {
  return useMemo(() => {
    console.log('🔗 Creating Tag Assignment API instance with authentication context');
    return createExtendedTagAssignmentApi(testClient);
  }, [testClient]);
};

/**
 * Hook for accessing tag assignment API with current authentication context
 * Use this in components instead of importing tagAssignmentApi directly
 */
export const useAuthenticatedTagAssignmentApi = () => {
  return useTagAssignmentApi();
};
