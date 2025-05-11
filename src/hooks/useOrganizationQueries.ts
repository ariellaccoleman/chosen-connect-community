
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationWithLocation, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { formatLocationWithDetails } from '@/utils/formatters';
import { Tag, TagAssignment } from '@/utils/tagUtils';

/**
 * Hook to fetch all organizations
 */
export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<OrganizationWithLocation[]> => {
      // First, fetch organizations with locations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('name');
      
      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
        throw orgsError; // Throw the error to be handled by the query
      }
      
      // Transform organizations to match the expected type
      const orgsWithLocations = orgsData.map(org => {
        return {
          ...org,
          is_verified: org.is_verified || false,
          created_at: org.created_at || '',
          updated_at: org.updated_at || '',
          location: org.location ? formatLocationWithDetails(org.location) : undefined,
          tags: [] // Initialize with empty array
        } as OrganizationWithLocation;
      });
      
      // Now fetch tag assignments for all organizations in a separate query
      if (orgsWithLocations.length > 0) {
        try {
          const orgIds = orgsWithLocations.map(org => org.id);
          
          const { data: tagAssignments, error: tagError } = await supabase
            .from('tag_assignments')
            .select(`
              *,
              tag:tags(*)
            `)
            .eq('target_type', 'organization')
            .in('target_id', orgIds);
            
          if (tagError) {
            console.error('Error fetching organization tags:', tagError);
          } else if (tagAssignments) {
            // Map tag assignments to their respective organizations
            orgsWithLocations.forEach(org => {
              // Find tag assignments for this organization
              const orgTagAssignments = tagAssignments.filter(ta => ta.target_id === org.id);
              
              // Transform the tag assignments to match the expected TagAssignment type
              const formattedAssignments = orgTagAssignments.map(ta => {
                // Create a properly typed tag object with default values
                // Use a type assertion to help TypeScript understand the structure
                const tagData = (ta.tag || {}) as Partial<Tag>;
                
                // Ensure used_entity_types is always a string array
                const usedEntityTypes = Array.isArray(tagData.used_entity_types) 
                  ? tagData.used_entity_types 
                  : (tagData.used_entity_types ? [String(tagData.used_entity_types)] : []);
                
                return {
                  ...ta,
                  tag: {
                    ...tagData,
                    used_entity_types: usedEntityTypes,
                    // Ensure all required Tag properties have default values
                    id: tagData.id || '',
                    name: tagData.name || '',
                    description: tagData.description || null,
                    type: tagData.type || null,
                    is_public: tagData.is_public || false,
                    created_by: tagData.created_by || null,
                    created_at: tagData.created_at || '',
                    updated_at: tagData.updated_at || ''
                  } as Tag
                } as TagAssignment;
              });
              
              org.tags = formattedAssignments;
            });
          }
        } catch (error) {
          console.error('Error in tag assignments fetch:', error);
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
      
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('org_relationships')
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('profile_id', profileId);
      
      if (relationshipsError) {
        console.error('Error fetching user organizations:', relationshipsError);
        return [];
      }
      
      return relationshipsData.map(relationship => {
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
