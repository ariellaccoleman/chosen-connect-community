
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationAdmin, OrganizationAdminWithDetails, ProfileWithDetails, Location, LocationWithDetails, OrganizationWithLocation } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';
import { formatLocation } from '@/utils/formatters';

// Helper function to ensure type safety when accessing object properties
const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};

// Helper function to create a ProfileWithDetails from response data
const createProfileWithDetails = (profileData: any): ProfileWithDetails => {
  if (!profileData) {
    // Return a minimal valid ProfileWithDetails when no data is provided
    return {
      id: '',
      email: '',
      first_name: '',
      last_name: '',
      avatar_url: null,
      headline: null,
      bio: null,
      linkedin_url: null,
      twitter_url: null,
      website_url: null,
      role: 'member',
      location_id: null,
      full_name: ''
    };
  }
  
  return {
    id: profileData.id || '',
    email: profileData.email || '',
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    avatar_url: profileData.avatar_url,
    headline: profileData.headline,
    bio: profileData.bio,
    linkedin_url: profileData.linkedin_url,
    twitter_url: profileData.twitter_url,
    website_url: profileData.website_url,
    role: (profileData.role as "admin" | "member") || 'member',
    location_id: profileData.location_id,
    company: profileData.company,
    created_at: profileData.created_at,
    updated_at: profileData.updated_at,
    is_approved: profileData.is_approved,
    membership_tier: profileData.membership_tier,
    full_name: [profileData.first_name, profileData.last_name]
      .filter(Boolean)
      .join(' ')
  };
};

// Helper function to create LocationWithDetails
const createLocationWithDetails = (locationData: any): LocationWithDetails | undefined => {
  if (!locationData) return undefined;
  
  return {
    id: locationData.id || '',
    city: locationData.city || '',
    region: locationData.region || '',
    country: locationData.country || '',
    full_name: locationData.full_name || '',
    created_at: locationData.created_at,
    updated_at: locationData.updated_at,
    formatted_location: formatLocation({
      city: locationData.city || '',
      region: locationData.region || '',
      country: locationData.country || '',
      id: locationData.id || '',
      full_name: locationData.full_name
    })
  };
};

// Helper function to create organization with location
const createOrganizationWithLocation = (organizationData: any): OrganizationWithLocation => {
  if (!organizationData) {
    // Return minimal valid organization when no data is provided
    return {
      id: '',
      name: '',
      description: null,
      website_url: null,
      logo_url: null,
      logo_api_url: null,
      created_at: '',
      updated_at: '',
      location_id: null,
      location: undefined
    };
  }
  
  const org: OrganizationWithLocation = {
    ...organizationData,
    location: undefined
  };
  
  // Add location if it exists
  if (organizationData.location) {
    org.location = createLocationWithDetails(organizationData.location);
  }
  
  return org;
};

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
      
      return (data || []).map(admin => {
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role || '',
          is_approved: admin.is_approved || false,
          created_at: admin.created_at || '',
          updated_at: admin.updated_at,
          can_edit_profile: admin.can_edit_profile,
          profile: createProfileWithDetails(admin.profile),
          organization: createOrganizationWithLocation(admin.organization)
        };
        
        return adminWithDetails;
      });
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
      
      return (data || []).map(admin => {
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role || '',
          is_approved: admin.is_approved || false,
          created_at: admin.created_at || '',
          updated_at: admin.updated_at,
          can_edit_profile: admin.can_edit_profile,
          profile: createProfileWithDetails(admin.profile),
          organization: createOrganizationWithLocation(admin.organization)
        };
        
        return adminWithDetails;
      });
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
      
      return (data || []).map(admin => {
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role || '',
          is_approved: admin.is_approved || false,
          created_at: admin.created_at || '',
          updated_at: admin.updated_at,
          can_edit_profile: admin.can_edit_profile,
          profile: createProfileWithDetails(admin.profile),
          organization: createOrganizationWithLocation(admin.organization)
        };
        
        return adminWithDetails;
      });
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

// Create a new organization admin request
export const useCreateAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: {
      profile_id: string;
      organization_id: string;
      role?: string;
    }) => {
      const { error } = await supabase
        .from('organization_admins')
        .insert({
          profile_id: request.profile_id,
          organization_id: request.organization_id,
          role: request.role || 'editor',
          is_approved: false
        });
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('organization_admins')
        .update(updates)
        .eq('id', requestId);
      
      if (error) throw error;
      
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
