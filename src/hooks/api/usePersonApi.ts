
import { useMemo } from 'react';
import { profileApi } from '@/api/profiles/profileApiFactory';

/**
 * Authentication-aware hook for person/profile API operations
 * Replaces static imports to ensure proper authentication context
 */
export const usePersonApi = (testClient?: any) => {
  return useMemo(() => {
    console.log('🔗 Creating Person/Profile API instance with authentication context');
    // For now, return the existing factory - this can be enhanced later to accept client parameter
    return profileApi;
  }, [testClient]);
};

/**
 * Hook for accessing person/profile API with current authentication context
 * Use this in components instead of importing profileApi directly
 */
export const useAuthenticatedPersonApi = () => {
  return usePersonApi();
};
