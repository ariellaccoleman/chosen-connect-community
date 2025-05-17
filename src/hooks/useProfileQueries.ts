
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useCurrentProfile } from '@/hooks/profiles/useCurrentProfile';
 * import { useProfileById } from '@/hooks/profiles';
 */

export { useCurrentProfile } from "./profiles/useCurrentProfile";

/**
 * Enhanced hook to access the current user's profile with proper data unwrapping
 * @deprecated Use useCurrentProfile from '@/hooks/profiles' instead
 */
export const useCurrentProfileWithData = (userId?: string, authUser?: any) => {
  console.warn("Deprecated: Use useCurrentProfile from '@/hooks/profiles' instead");
  const { useCurrentProfile } = require('./profiles/useCurrentProfile');
  const response = useCurrentProfile();
  return {
    ...response,
    profile: response.data, // Provide direct access to the profile data
  };
};
