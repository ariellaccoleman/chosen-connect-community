
import { useMemo } from 'react';
import { createExtendedTagApi } from '@/api/tags/factory/tagApiFactory';

/**
 * Authentication-aware hook for tag API operations
 * Replaces static imports of tagApi to ensure proper authentication context
 */
export const useTagApi = (testClient?: any) => {
  return useMemo(() => {
    console.log('🔗 Creating Tag API instance with authentication context');
    return createExtendedTagApi(testClient);
  }, [testClient]);
};

/**
 * Hook for accessing tag API with current authentication context
 * Use this in components instead of importing tagApi directly
 */
export const useAuthenticatedTagApi = () => {
  return useTagApi();
};
