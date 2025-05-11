
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { formatLocationWithDetails } from '@/utils/adminFormatters';

/**
 * Hook to fetch all organizations
 */
export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<OrganizationWithLocation[]> => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          location:locations(*),
          tags:tag_assignments(
            id,
            tag_id,
            tags(*)
          )
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching organizations:', error);
        return [];
      }
      
      return data.map(org => {
        if (org.location) {
          return {
            ...org,
            location: formatLocationWithDetails(org.location)
          };
        }
        return org;
      }) as OrganizationWithLocation[];
    },
  });
};

/**
 * Hook to fetch organization relationships for a specific user
 */
export const useUserOrganizationRelationships = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['organizationRelationships', profileId],
    queryFn: async () => {
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
        console.error('Error fetching user organizations:', error);
        return [];
      }
      
      return data.map(relationship => {
        if (relationship.organization && relationship.organization.location) {
          return {
            ...relationship,
            organization: {
              ...relationship.organization,
              location: formatLocationWithDetails(relationship.organization.location)
            }
          };
        }
        return relationship;
      }) as ProfileOrganizationRelationshipWithDetails[];
    },
    enabled: !!profileId,
  });
};
