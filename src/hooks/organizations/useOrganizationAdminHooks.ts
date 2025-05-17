
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationAdminWithDetails } from '@/types';
import { formatAdminWithDetails } from '@/utils/adminFormatters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationAdmin } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';

// Fetch all organization admin requests (for site admins)
export const useOrganizationAdmins = (filters: { status?: 'pending' | 'approved' | 'all' } = {}) => {
  return useQuery({
    queryKey: ['organization-admins', filters],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      let query = supabase
        .from('organization_admins')
        .select(`
          *,
          profile:profiles(*),
          organization:organizations(
            *,
            location:locations(*)
          )
        `);
      
      if (filters.status === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filters.status === 'approved') {
        query = query.eq('is_approved', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching organization admins:', error);
        return [];
      }
      
      return (data || []).map(admin => formatAdminWithDetails(admin));
    },
  });
};

// Fetch organization admins for a specific organization
export const useOrganizationAdminsByOrg = (organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-admins', 'organization', organizationId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_admins')
        .select(`
          *,
          profile:profiles(*),
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching organization admins:', error);
        return [];
      }
      
      return (data || []).map(admin => formatAdminWithDetails(admin));
    },
    enabled: !!organizationId,
  });
};

// Fetch pending admin requests for a specific organization
export const usePendingOrganizationAdmins = (organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-admins', 'pending', organizationId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_admins')
        .select(`
          *,
          profile:profiles(*),
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching pending organization admins:', error);
        return [];
      }
      
      return (data || []).map(admin => formatAdminWithDetails(admin));
    },
    enabled: !!organizationId,
  });
};

// Check if user is admin for a specific organization
export const useIsOrganizationAdmin = (userId: string | undefined, organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['is-organization-admin', userId, organizationId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !organizationId) return false;
      
      const { data, error } = await supabase
        .from('organization_admins')
        .select('id')
        .eq('profile_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_approved', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking if user is organization admin:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!userId && !!organizationId,
  });
};

// Check if user has a specific role in an organization
export const useOrganizationRole = (userId: string | undefined, organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-role', userId, organizationId],
    queryFn: async (): Promise<string | null> => {
      if (!userId || !organizationId) return null;
      
      const { data, error } = await supabase
        .from('organization_admins')
        .select('role')
        .eq('profile_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_approved', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking organization role:', error);
        return null;
      }
      
      return data?.role || null;
    },
    enabled: !!userId && !!organizationId,
  });
};

// Fetch user's admin requests (for current user)
export const useUserAdminRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-admin-requests', userId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('organization_admins')
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          ),
          profile:profiles(*)
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user admin requests:', error);
        return [];
      }
      
      return (data || []).map(admin => formatAdminWithDetails(admin));
    },
    enabled: !!userId,
  });
};

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
