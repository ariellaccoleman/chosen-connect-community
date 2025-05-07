import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationAdmin, OrganizationAdminWithDetails, ProfileWithDetails, Location, LocationWithDetails, OrganizationWithLocation } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';
import { formatLocation } from '@/utils/formatters';

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
      
      return data.map(admin => {
        // Format profile
        const profileData = admin.profile || {};
        const profileWithDetails: ProfileWithDetails = {
          id: profileData.id || '',
          email: profileData.email || '',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          avatar_url: profileData.avatar_url || null,
          headline: profileData.headline || null,
          bio: profileData.bio || null,
          linkedin_url: profileData.linkedin_url || null,
          twitter_url: profileData.twitter_url || null,
          website_url: profileData.website_url || null,
          role: profileData.role || 'member',
          location_id: profileData.location_id || null,
          company: profileData.company || null,
          created_at: profileData.created_at || '',
          is_approved: profileData.is_approved || false,
          membership_tier: profileData.membership_tier || 'free',
          full_name: [profileData.first_name, profileData.last_name]
            .filter(Boolean)
            .join(' ')
        };
        
        // Handle location for profile if it exists
        if (profileData.location_id && profileData.location) {
          const locationData = profileData.location || {};
          const locationWithDetails: LocationWithDetails = {
            id: locationData.id || '',
            city: locationData.city || '',
            region: locationData.region || '',
            country: locationData.country || '',
            full_name: locationData.full_name || '',
            formatted_location: formatLocation({
              city: locationData.city || '',
              region: locationData.region || '',
              country: locationData.country || '',
              id: locationData.id || '',
              full_name: locationData.full_name
            })
          };
          profileWithDetails.location = locationWithDetails;
        }
        
        // Handle organization
        let organizationWithLocation: OrganizationWithLocation = {
          ...admin.organization,
          location: undefined
        };
        
        // Format organization location
        if (admin.organization && admin.organization.location) {
          const locationData = admin.organization.location || {};
          const locationWithDetails: LocationWithDetails = {
            id: locationData.id || '',
            city: locationData.city || '',
            region: locationData.region || '',
            country: locationData.country || '',
            full_name: locationData.full_name || '',
            formatted_location: formatLocation({
              city: locationData.city || '',
              region: locationData.region || '',
              country: locationData.country || '',
              id: locationData.id || '',
              full_name: locationData.full_name
            })
          };
          organizationWithLocation.location = locationWithDetails;
        }
        
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role,
          is_approved: admin.is_approved,
          created_at: admin.created_at,
          can_edit_profile: admin.can_edit_profile,
          profile: profileWithDetails,
          organization: organizationWithLocation
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
      
      return data.map(admin => {
        // Format profile
        const profileData = admin.profile || {};
        const profileWithDetails: ProfileWithDetails = {
          id: profileData.id || '',
          email: profileData.email || '',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          avatar_url: profileData.avatar_url || null,
          headline: profileData.headline || null,
          bio: profileData.bio || null,
          linkedin_url: profileData.linkedin_url || null,
          twitter_url: profileData.twitter_url || null,
          website_url: profileData.website_url || null,
          role: profileData.role || 'member',
          location_id: profileData.location_id || null,
          company: profileData.company || null,
          created_at: profileData.created_at || '',
          is_approved: profileData.is_approved || false,
          membership_tier: profileData.membership_tier || 'free',
          full_name: [profileData.first_name, profileData.last_name]
            .filter(Boolean)
            .join(' ')
        };
        
        // Handle organization
        let organizationWithLocation: OrganizationWithLocation = {
          ...admin.organization,
          location: undefined
        };
        
        // Handle location for organization if it exists
        if (admin.organization && admin.organization.location) {
          const locationData = admin.organization.location || {};
          const locationWithDetails: LocationWithDetails = {
            id: locationData.id || '',
            city: locationData.city || '',
            region: locationData.region || '',
            country: locationData.country || '',
            full_name: locationData.full_name || '',
            formatted_location: formatLocation({
              city: locationData.city || '',
              region: locationData.region || '',
              country: locationData.country || '',
              id: locationData.id || '',
              full_name: locationData.full_name
            })
          };
          organizationWithLocation.location = locationWithDetails;
        }
        
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role,
          is_approved: admin.is_approved,
          created_at: admin.created_at,
          can_edit_profile: admin.can_edit_profile,
          profile: profileWithDetails,
          organization: organizationWithLocation
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
      
      return data.map(admin => {
        // Create profile with details
        const profileData = admin.profile || {};
        const profileWithDetails: ProfileWithDetails = {
          id: profileData.id || '',
          email: profileData.email || '',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          avatar_url: profileData.avatar_url || null,
          headline: profileData.headline || null,
          bio: profileData.bio || null,
          linkedin_url: profileData.linkedin_url || null,
          twitter_url: profileData.twitter_url || null,
          website_url: profileData.website_url || null,
          role: profileData.role || 'member',
          location_id: profileData.location_id || null,
          company: profileData.company || null,
          created_at: profileData.created_at || '',
          is_approved: profileData.is_approved || false,
          membership_tier: profileData.membership_tier || 'free',
          full_name: [profileData.first_name, profileData.last_name]
            .filter(Boolean)
            .join(' ')
        };

        // Handle organization
        let organizationWithLocation: OrganizationWithLocation = {
          ...admin.organization,
          location: undefined
        };

        // Format organization
        if (admin.organization && admin.organization.location) {
          const locationData = admin.organization.location || {};
          const locationWithDetails: LocationWithDetails = {
            id: locationData.id || '',
            city: locationData.city || '',
            region: locationData.region || '',
            country: locationData.country || '',
            full_name: locationData.full_name || '',
            formatted_location: formatLocation({
              city: locationData.city || '',
              region: locationData.region || '',
              country: locationData.country || '',
              id: locationData.id || '',
              full_name: locationData.full_name
            })
          };
          organizationWithLocation.location = locationWithDetails;
        }
        
        // Create the admin details
        const adminWithDetails: OrganizationAdminWithDetails = {
          id: admin.id,
          profile_id: admin.profile_id,
          organization_id: admin.organization_id,
          role: admin.role,
          is_approved: admin.is_approved,
          created_at: admin.created_at,
          can_edit_profile: admin.can_edit_profile,
          profile: profileWithDetails,
          organization: organizationWithLocation
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
