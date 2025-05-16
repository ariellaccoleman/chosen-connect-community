
import { createQueryHooks } from '../core/factory/queryHookFactory';
import { profileApi } from '@/api/profiles/profileApiFactory';
import { ProfileWithDetails } from '@/types';

// Create standard CRUD hooks for profiles using the factory
const {
  useList: useProfileList,
  useById: useProfileById,
  useByIds: useProfilesByIds,
  useCreate: useCreateProfile,
  useUpdateFactory: useUpdateProfileFactory,
  useDelete: useDeleteProfile
} = createQueryHooks<ProfileWithDetails>(
  { 
    name: 'profile',
    pluralName: 'profiles',
    displayName: 'Profile',
    pluralDisplayName: 'Profiles'
  },
  profileApi
);

// Create standard update profile hook
const useUpdateProfile = useUpdateProfileFactory();

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
