import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileWithDetails, Location } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';
import { getGeoNameLocationById } from '@/utils/geoNamesUtils';
import { useGeoNamesLocations } from '@/hooks/useGeoNamesLocations';

export const useCurrentProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (!data) return null;
      
      const profile = data as ProfileWithDetails;
      
      // Format full name
      profile.full_name = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ');
      
      // If location_id exists, fetch from GeoNames API instead of local DB
      if (profile.location_id) {
        try {
          const locationDetails = await getGeoNameLocationById(profile.location_id);
          if (locationDetails) {
            profile.location = locationDetails;
          }
        } catch (err) {
          console.error('Error fetching location details:', err);
        }
      }
      
      return profile;
    },
    enabled: !!userId,
  });
};

export const useProfiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profiles', userId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (!data) return null;
      
      const profile = data as ProfileWithDetails;
      
      // Format full name
      profile.full_name = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ');
      
      // If location_id exists, fetch from GeoNames API instead of local DB
      if (profile.location_id) {
        try {
          const locationDetails = await getGeoNameLocationById(profile.location_id);
          if (locationDetails) {
            profile.location = locationDetails;
          }
        } catch (err) {
          console.error('Error fetching location details:', err);
        }
      }
      
      return profile;
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      profileId, 
      profileData 
    }: { 
      profileId: string, 
      profileData: Partial<Profile> 
    }) => {
      console.log('Updating profile with data:', profileData);
      
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
            ...profileData 
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
          .update(profileData)
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
      onSuccessCallback: (_, variables) => {
        // Invalidate both profile queries to ensure they're refreshed
        queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
        queryClient.invalidateQueries({ queryKey: ['profiles', variables.profileId] });
        
        // Also invalidate community profiles query
        queryClient.invalidateQueries({ queryKey: ['community-profiles'] });
      }
    })
  });
};

export const useLocations = (searchTerm: string = '') => {
  return useGeoNamesLocations(searchTerm);
};
