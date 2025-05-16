
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { profileApi } from '@/api/profiles/profileApiFactory';
import { ProfileWithDetails, MembershipTier } from '@/types';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';
import { User } from '@supabase/supabase-js';
import { createMutationHandlers } from '@/utils/toastUtils';

// Create standard hooks using the factory
const profileHooks = createQueryHooks<ProfileWithDetails, string>(
  { 
    name: 'profile',
    pluralName: 'profiles',
    displayName: 'Profile',
    pluralDisplayName: 'Profiles'
  },
  profileApi
);

// Export individual hooks from the factory
export const useProfileList = profileHooks.useList;
export const useProfileById = profileHooks.useById;
export const useProfilesByIds = profileHooks.useByIds;
export const useCreateProfile = profileHooks.useCreate;
export const useUpdateProfileFactory = profileHooks.useUpdate;
export const useDeleteProfile = profileHooks.useDelete;

/**
 * Hook for getting the current user's profile
 */
export const useCurrentProfile = (userId: string | undefined, authUser?: User | null) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!userId) return null;
      
      const response = await profileApi.getById(userId);
      
      if (response.error) {
        console.error('Error fetching profile:', response.error);
        return null;
      }
      
      const profile = response.data;
      
      // Add role from auth user metadata if available
      if (authUser && authUser.user_metadata?.role && profile) {
        profile.role = authUser.user_metadata.role as "admin" | "member";
      }
      
      return profile;
    },
    enabled: !!userId,
  });
};

/**
 * Enhanced hook for updating a profile with improved error handling
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      profileId, 
      profileData 
    }: { 
      profileId: string, 
      profileData: Partial<ProfileWithDetails>
    }) => {
      logger.info('Updating profile with data:', profileData);
      
      // Filter out UI-specific fields that may come from form data
      // These are handled by the transformRequest function in the API factory
      
      // Ensure membership_tier is a valid enum value if it exists
      if (profileData.membership_tier) {
        const validTiers: MembershipTier[] = ["free", "community", "pro", "partner"];
        if (!validTiers.includes(profileData.membership_tier as MembershipTier)) {
          profileData.membership_tier = "free" as MembershipTier;
        }
      }
      
      // Check if there are any actual changes to make
      if (Object.keys(profileData).length === 0) {
        logger.info('No profile data to update, skipping database operation');
        return null;
      }
      
      const response = await profileApi.update(profileId, profileData);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    ...createMutationHandlers({
      successMessage: 'Profile updated successfully',
      errorMessagePrefix: 'Error updating profile',
      onSuccessCallback: (data, variables) => {
        // Only invalidate queries and show success message if we actually made changes
        if (data) {
          // Invalidate both profile queries to ensure they're refreshed
          queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
          queryClient.invalidateQueries({ queryKey: ['profiles'] });
          
          // Also invalidate community profiles query
          queryClient.invalidateQueries({ queryKey: ['community-profiles'] });
        } else {
          // No profile update was made, so remove the success toast notification
          // This is handled internally in createMutationHandlers when data is null
          logger.info('No profile changes were made');
        }
      }
    })
  });
};
