
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
export const useProfileList = hookFactory.useList;
export const useProfileById = hookFactory.useById;
export const useProfilesByIds = hookFactory.useByIds;
export const useCreateProfile = hookFactory.useCreate;
export const useDeleteProfile = hookFactory.useDelete;
export const useUpdateProfile = hookFactory.useUpdate;

// Removed useCurrentProfile export as it's now in its own file
