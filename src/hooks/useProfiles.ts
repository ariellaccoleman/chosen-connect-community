
// This file now re-exports all profile-related hooks from their respective files
// for backwards compatibility

export { useCurrentProfile, useProfiles } from './useProfileQueries';
export { useUpdateProfile } from './useProfileMutations';
export { useLocations } from './useLocations';
