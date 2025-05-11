
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
      // First, fetch organizations with locations
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching organizations:', error);
        return [];
      }
      
      // Then, for each organization, fetch its tags separately
      const orgsWithLocations = data.map(org => {
        // Transform the organization to match the expected type
        return {
          ...org,
          is_verified: org.is_verified || false,
          created_at: org.created_at || '',
          updated_at: org.updated_at || '',
          location: org.location ? formatLocationWithDetails(org.location) : undefined,
          tags: [] // Initialize with empty array
        } as OrganizationWithLocation;
      });
      
      // Now fetch tag assignments for all organizations in a single query
      const orgIds = orgsWithLocations.map(org => org.id);
      
      if (orgIds.length > 0) {
        const { data: tagAssignments, error: tagError } = await supabase
          .from('tag_assignments')
          .select(`
            *,
            tags(*)
          `)
          .eq('target_type', 'organization')
          .in('target_id', orgIds);
          
        if (tagError) {
          console.error('Error fetching organization tags:', tagError);
        } else if (tagAssignments) {
          // Map tag assignments to their respective organizations
          for (const org of orgsWithLocations) {
            org.tags = tagAssignments.filter(ta => ta.target_id === org.id);
          }
        }
      }
      
      return orgsWithLocations;
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
            location: undefined, // Default to undefined
            tags: [] // Initialize empty tags array
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
