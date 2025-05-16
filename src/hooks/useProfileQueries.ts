

// Re-export all profile queries from the new module for backwards compatibility
export { useCurrentProfile } from "./profiles";

/**
 * Enhanced hook to access the current user's profile with proper data unwrapping
 */
export const useCurrentProfileWithData = (userId?: string, authUser?: any) => {
  const response = useCurrentProfile(userId, authUser);
  return {
    ...response,
    profile: response.data, // Provide direct access to the profile data
  };
};
