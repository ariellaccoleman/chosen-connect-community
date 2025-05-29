
import { useMemo } from 'react';
import { organizationApi } from '@/api/organizations/organizationApiFactory';

/**
 * Authentication-aware hook for organization API operations
 * Replaces static imports to ensure proper authentication context
 */
export const useOrganizationApi = (testClient?: any) => {
  return useMemo(() => {
    console.log('🔗 Creating Organization API instance with authentication context');
    // For now, return the existing factory - this can be enhanced later to accept client parameter
    return organizationApi;
  }, [testClient]);
};

/**
 * Hook for accessing organization API with current authentication context
 * Use this in components instead of importing organizationApi directly
 */
export const useAuthenticatedOrganizationApi = () => {
  return useOrganizationApi();
};
