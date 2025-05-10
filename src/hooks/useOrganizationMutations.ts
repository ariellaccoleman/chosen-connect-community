
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileOrganizationRelationship } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';

/**
 * Hook to add an organization relationship
 */
export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relationship: Partial<ProfileOrganizationRelationship>) => {
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
      
      // Convert "connected_insider" to "ally" for database compatibility
      const dbConnectionType = relationship.connection_type === "connected_insider" ? "ally" : relationship.connection_type;
      
      // Now create the organization relationship
      const { error } = await supabase
        .from('org_relationships')
        .insert({
          profile_id: relationship.profile_id,
          organization_id: relationship.organization_id,
          connection_type: dbConnectionType,
          department: relationship.department,
          notes: relationship.notes
        });
      
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

/**
 * Hook to update an organization relationship
 */
export const useUpdateOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      relationshipId, 
      relationshipData 
    }: { 
      relationshipId: string, 
      relationshipData: Partial<ProfileOrganizationRelationship> 
    }) => {
      // Convert "connected_insider" to "ally" for database compatibility
      const dbConnectionType = relationshipData.connection_type === "connected_insider" ? "ally" : relationshipData.connection_type;
      
      const { error } = await supabase
        .from('org_relationships')
        .update({
          connection_type: dbConnectionType,
          department: relationshipData.department,
          notes: relationshipData.notes
        })
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

/**
 * Hook to delete an organization relationship
 */
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
