
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { formatLocationWithDetails } from '@/utils/formatters';

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
        // Transform the organization to match the expected type
        const result: OrganizationWithLocation = {
          ...org,
          is_verified: org.is_verified || false,
          created_at: org.created_at || '',
          updated_at: org.updated_at || '',
          location: undefined, // Default to undefined
          tags: [] // Default to empty array
        };
        
        // Add formatted location if available
        if (org.location) {
          result.location = formatLocationWithDetails(org.location);
        }
        
        // Transform tag_assignments to the expected format
        if (org.tags && Array.isArray(org.tags)) {
          result.tags = org.tags;
        }
        
        return result;
      });
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
        // Create a properly typed organization relationship
        const typedRelationship: ProfileOrganizationRelationshipWithDetails = {
          ...relationship,
          organization: {
            ...relationship.organization,
            is_verified: relationship.organization?.is_verified || false,
            created_at: relationship.organization?.created_at || '',
            updated_at: relationship.organization?.updated_at || '',
            location: undefined // Default to undefined
          }
        };
        
        // Add properly formatted location if available
        if (relationship.organization && relationship.organization.location) {
          typedRelationship.organization.location = formatLocationWithDetails(relationship.organization.location);
        }
        
        return typedRelationship;
      });
    },
    enabled: !!profileId,
  });
};
