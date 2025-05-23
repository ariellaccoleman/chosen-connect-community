
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { createMutationHandlers } from '@/utils/toastUtils';

// Import the MembershipTier type
type MembershipTier = "free" | "community" | "pro" | "partner";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      profileId, 
      profileData 
    }: { 
      profileId: string, 
      profileData: Partial<Profile> & { [key: string]: any } 
    }) => {
      console.log('Updating profile with data:', profileData);
      
      // Filter out non-profile fields that may come from form data
      // These fields are used for UI actions, not actual profile data
      const cleanedProfileData = { ...profileData };
      
      // Remove fields that are not part of the profiles table
      delete cleanedProfileData.addOrganizationRelationship;
      delete cleanedProfileData.navigateToManageOrgs;
      
      // Ensure membership_tier is a valid enum value if it exists
      if (cleanedProfileData.membership_tier) {
        const validTiers: MembershipTier[] = ["free", "community", "pro", "partner"];
        if (!validTiers.includes(cleanedProfileData.membership_tier as MembershipTier)) {
          cleanedProfileData.membership_tier = "free" as MembershipTier;
        }
      }
      
      // Check if there are any actual changes to make
      if (Object.keys(cleanedProfileData).length === 0) {
        console.log('No profile data to update, skipping database operation');
        return null;
      }
      
      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        throw checkError;
      }
      
      let result;
      
      if (!existingProfile) {
        // Profile doesn't exist, create it
        console.log('Profile does not exist, creating new profile');
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: profileId, 
            ...cleanedProfileData 
          })
          .select();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        
        result = data;
      } else {
        // Profile exists, update it
        console.log('Profile exists, updating');
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update(cleanedProfileData)
          .eq('id', profileId)
          .select();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
        
        result = data;
      }
      
      console.log('Operation successful, response:', result);
      return result;
    },
    ...createMutationHandlers({
      successMessage: 'Profile updated successfully',
      errorMessagePrefix: 'Error updating profile',
      onSuccessCallback: (data, variables) => {
        // Only invalidate queries and show success message if we actually made changes
        if (data) {
          // Invalidate both profile queries to ensure they're refreshed
          queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
          queryClient.invalidateQueries({ queryKey: ['profiles', variables.profileId] });
          
          // Also invalidate community profiles query
          queryClient.invalidateQueries({ queryKey: ['community-profiles'] });
        } else {
          // No profile update was made, so remove the success toast notification
          // This is handled internally in createMutationHandlers when data is null
          console.log('No profile changes were made');
        }
      }
    })
  });
};
