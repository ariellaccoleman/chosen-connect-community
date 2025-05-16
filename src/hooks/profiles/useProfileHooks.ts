
import { createQueryHooks } from '../core/factory/queryHookFactory';
import { profileApi } from '@/api/profiles/profileApiFactory';
import { ProfileWithDetails } from '@/types';

// Create standard CRUD hooks for profiles using the factory
const hookFactory = createQueryHooks<ProfileWithDetails>(
  { 
    name: 'profile',
    pluralName: 'profiles',
    displayName: 'Profile',
    pluralDisplayName: 'Profiles'
  },
  profileApi
);

// Extract all the hooks from the factory
const useProfileList = hookFactory.useList;
const useProfileById = hookFactory.useById;
const useProfilesByIds = hookFactory.useByIds;
const useCreateProfile = hookFactory.useCreate;
const useDeleteProfile = hookFactory.useDelete;
const createUpdateProfileHook = hookFactory.createUpdateHook;

// Create standard update profile hook
const useUpdateProfile = createUpdateProfileHook();
const useUpdateProfileFactory = createUpdateProfileHook;

/**
 * Hook to access the current user's profile
 */
const useCurrentProfile = (userId?: string, authUser?: any) => {
  return useProfileById(userId || authUser?.id);
};

// Export all hooks
export {
  useProfileList,
  useProfileById,
  useProfilesByIds,
  useCreateProfile,
  useUpdateProfileFactory,
  useUpdateProfile,
  useDeleteProfile,
  useCurrentProfile
};
