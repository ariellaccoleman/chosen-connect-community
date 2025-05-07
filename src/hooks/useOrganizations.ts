
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationWithLocation, OrganizationRelationship } from '@/types';
import { toast } from '@/components/ui/sonner';
import { createMutationHandlers } from '@/utils/toastUtils';

export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<OrganizationWithLocation[]> => {
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
      
      return data.map(org => {
        if (org.location) {
          const location = org.location;
          return {
            ...org,
            location: {
              ...location,
              formatted_location: [location.city, location.region, location.country]
                .filter(Boolean)
                .join(', ')
            }
          };
        }
        return org;
      });
    },
  });
};

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
          const location = relationship.organization.location;
          return {
            ...relationship,
            organization: {
              ...relationship.organization,
              location: {
                ...location,
                formatted_location: [location.city, location.region, location.country]
                  .filter(Boolean)
                  .join(', ')
              }
            }
          };
        }
        return relationship;
      });
    },
    enabled: !!profileId,
  });
};

export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relationship: Partial<OrganizationRelationship>) => {
      console.log('Adding organization relationship:', relationship);
      
      if (!relationship.profile_id) {
        throw new Error('Profile ID is required');
      }
      
      // First check if the profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', relationship.profile_id)
        .maybeSingle();
      
      if (profileCheckError) {
        console.error('Error checking profile existence:', profileCheckError);
        throw profileCheckError;
      }
      
      // If profile doesn't exist, create a minimal one
      if (!existingProfile) {
        console.log('Profile does not exist, creating a minimal profile first');
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({ 
            id: relationship.profile_id 
          });
        
        if (profileCreateError) {
          console.error('Error creating profile:', profileCreateError);
          throw profileCreateError;
        }
        console.log('Successfully created minimal profile');
      }
      
      // Now create the organization relationship
      const { error } = await supabase
        .from('org_relationships')
        .insert(relationship);
      
      if (error) {
        console.error('Error adding organization relationship:', error);
        throw error;
      }
      
      console.log('Successfully added organization relationship');
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Organization relationship added successfully',
      errorMessagePrefix: 'Error adding organization relationship',
      onSuccessCallback: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['organizationRelationships', variables.profile_id] });
      }
    })
  });
};

export const useUpdateOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      relationshipId, 
      relationshipData 
    }: { 
      relationshipId: string, 
      relationshipData: Partial<OrganizationRelationship> 
    }) => {
      const { error } = await supabase
        .from('org_relationships')
        .update(relationshipData)
        .eq('id', relationshipId);
      
      if (error) throw error;
      
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Organization relationship updated successfully',
      errorMessagePrefix: 'Error updating organization relationship',
      onSuccessCallback: () => {
        // We need to refetch the profile's relationships
        queryClient.invalidateQueries({ queryKey: ['organizationRelationships'] });
      }
    })
  });
};

export const useDeleteOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const { error } = await supabase
        .from('org_relationships')
        .delete()
        .eq('id', relationshipId);
      
      if (error) throw error;
      
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Organization relationship removed successfully',
      errorMessagePrefix: 'Error removing organization relationship',
      onSuccessCallback: () => {
        queryClient.invalidateQueries({ queryKey: ['organizationRelationships'] });
      }
    })
  });
};
