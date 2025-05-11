
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationRelationshipWithDetails } from '@/types';

// Hook to fetch organization relationships for a public profile
export const usePublicProfileOrganizations = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile-organizations', profileId],
    queryFn: async (): Promise<OrganizationRelationshipWithDetails[]> => {
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
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching organization relationships:', error);
        throw error;
      }
      
      return data as OrganizationRelationshipWithDetails[];
    },
    enabled: !!profileId,
  });
};
