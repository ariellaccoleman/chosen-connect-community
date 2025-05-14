
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileOrganizationRelationshipWithDetails } from '@/types';

// Hook to fetch organization relationships for a public profile
export const usePublicProfileOrganizations = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-organizations', profileId],
    queryFn: async (): Promise<ProfileOrganizationRelationshipWithDetails[]> => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('org_relationships')
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('profile_id', profileId);
      
      if (error) {
        console.error('Error fetching profile organizations:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!profileId,
  });
};
