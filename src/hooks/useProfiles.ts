
// This file now re-exports all profile-related hooks from their respective files
// for backwards compatibility

export { useCurrentProfile } from './useProfileQueries';
export { useUpdateProfile } from './profiles';
export { useLocations } from './useLocations';

// Define and export useProfiles for backward compatibility
// This is needed because it's being exported but not defined in useProfileQueries anymore
import { useCurrentProfile } from './useProfileQueries';

export const useProfiles = (userId: string | undefined, authUser?: any) => {
  return useCurrentProfile(userId, authUser);
};
