import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationAdmin } from "@/types";
import { toast } from "sonner";
import { createMutationHandlers } from "@/utils/toastUtils";

// Valid organization admin roles
const VALID_ROLES = ['owner', 'admin', 'editor'];

// Create a new organization admin request
export const useCreateAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: {
      profile_id: string;
      organization_id: string;
      role?: string;
    }) => {
      // Validate role before submitting
      const role = request.role || 'editor';
      if (!VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role: "${role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
      }
      
      const { error } = await supabase
        .from('organization_admins')
        .insert({
          profile_id: request.profile_id,
          organization_id: request.organization_id,
          role: role,
          is_approved: false
        });
      
      if (error) {
        // Provide a clearer error message
        if (error.message.includes('organization_admins_role_check')) {
          throw new Error(`Invalid role: "${role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
        }
        throw error;
      }
      
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request created successfully',
      errorMessagePrefix: 'Error creating admin request',
      onSuccessCallback: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests', variables.profile_id] });
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
      }
    })
  });
};

// Update an organization admin request (approve/reject)
export const useUpdateAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      updates 
    }: { 
      requestId: string, 
      updates: Partial<OrganizationAdmin> 
    }) => {
      // Validate role if it's being updated
      if (updates.role && !VALID_ROLES.includes(updates.role)) {
        throw new Error(`Invalid role: "${updates.role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
      }
      
      const { error } = await supabase
        .from('organization_admins')
        .update(updates)
        .eq('id', requestId);
      
      if (error) {
        // Provide a clearer error message
        if (error.message.includes('organization_admins_role_check')) {
          throw new Error(`Invalid role: "${updates.role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
        }
        throw error;
      }
      
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request updated successfully',
      errorMessagePrefix: 'Error updating admin request',
      onSuccessCallback: () => {
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests'] });
        queryClient.invalidateQueries({ queryKey: ['is-organization-admin'] });
      }
    })
  });
};

// Delete an organization admin request
export const useDeleteAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('organization_admins')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      
      return true;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request deleted successfully',
      errorMessagePrefix: 'Error deleting admin request',
      onSuccessCallback: () => {
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests'] });
        queryClient.invalidateQueries({ queryKey: ['is-organization-admin'] });
      }
    })
  });
};
