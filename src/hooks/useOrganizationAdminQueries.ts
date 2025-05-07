
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationAdminWithDetails } from '@/types';
import { formatAdminWithDetails } from '@/utils/adminFormatters';

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
