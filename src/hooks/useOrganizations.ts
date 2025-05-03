
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Organization, OrganizationWithLocation, OrganizationRelationship } from '@/types';
import { toast } from '@/components/ui/sonner';

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
      const { error } = await supabase
        .from('org_relationships')
        .insert(relationship);
      
      if (error) throw error;
      
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizationRelationships', variables.profile_id] });
      
      // Only show success toast after the operation has completed successfully
      toast.success('Organization relationship added successfully');
    },
    onError: (error: any) => {
      toast.error(`Error adding organization relationship: ${error.message}`);
    },
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
    onSuccess: (_, variables) => {
      // We need to refetch the profile's relationships
      queryClient.invalidateQueries({ queryKey: ['organizationRelationships'] });
      
      // Only show success toast after the operation has completed successfully
      toast.success('Organization relationship updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Error updating organization relationship: ${error.message}`);
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationRelationships'] });
      
      // Only show success toast after the operation has completed successfully
      toast.success('Organization relationship removed successfully');
    },
    onError: (error: any) => {
      toast.error(`Error removing organization relationship: ${error.message}`);
    },
  });
};
