
import { OrganizationAdmin, OrganizationAdminWithDetails } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/api/core/types";
import { createErrorResponse, createSuccessResponse } from "@/api/core/errorHandler";

/**
 * Transform raw organization admin data to the expected format
 */
const transformOrganizationAdminResponse = (data: any): OrganizationAdminWithDetails => {
  return {
    id: data.id,
    organization_id: data.organization_id,
    profile_id: data.profile_id,
    role: data.role,
    is_approved: data.is_approved,
    can_edit_profile: data.can_edit_profile,
    created_at: data.created_at,
    profile: data.profile,
    organization: data.organization
  };
};

/**
 * Factory for organization admin API operations
 */
export const organizationAdminApi = createApiFactory<
  OrganizationAdminWithDetails,
  string,
  Partial<OrganizationAdmin>,
  Partial<OrganizationAdmin>
>({
  tableName: 'organization_admins',
  entityName: 'OrganizationAdmin',
  idField: 'id',
  defaultSelect: `
    *,
    profile:profiles(*),
    organization:organizations(
      *,
      location:locations(*)
    )
  `,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: transformOrganizationAdminResponse,
  transformRequest: (data) => {
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects that should not be sent to the database
    delete cleanedData.profile;
    delete cleanedData.organization;
    
    // Ensure updated_at is set for updates
    if (!cleanedData.updated_at) {
      cleanedData.updated_at = new Date().toISOString();
    }
    
    return cleanedData;
  }
});

/**
 * Get all organization admin requests with filtering
 */
export const getAllOrganizationAdmins = async (filters: { 
  status?: 'pending' | 'approved' | 'all' 
} = {}): Promise<ApiResponse<OrganizationAdminWithDetails[]>> => {
  try {
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
      return createErrorResponse(error);
    }
    
    const formatted = (data || []).map(admin => transformOrganizationAdminResponse(admin));
    return createSuccessResponse(formatted);
  } catch (error) {
    console.error('Error in getAllOrganizationAdmins:', error);
    return createErrorResponse(error);
  }
};

/**
 * Get organization admins for a specific organization
 */
export const getOrganizationAdminsByOrg = async (
  organizationId: string,
  includeUnapproved = false
): Promise<ApiResponse<OrganizationAdminWithDetails[]>> => {
  try {
    let query = supabase
      .from('organization_admins')
      .select(`
        *,
        profile:profiles(*),
        organization:organizations(
          *,
          location:locations(*)
        )
      `)
      .eq('organization_id', organizationId);
    
    if (!includeUnapproved) {
      query = query.eq('is_approved', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching organization admins:', error);
      return createErrorResponse(error);
    }
    
    const formatted = (data || []).map(admin => transformOrganizationAdminResponse(admin));
    return createSuccessResponse(formatted);
  } catch (error) {
    console.error('Error in getOrganizationAdminsByOrg:', error);
    return createErrorResponse(error);
  }
};

/**
 * Get user's admin requests
 */
export const getUserAdminRequests = async (
  userId: string
): Promise<ApiResponse<OrganizationAdminWithDetails[]>> => {
  try {
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
      return createErrorResponse(error);
    }
    
    const formatted = (data || []).map(admin => transformOrganizationAdminResponse(admin));
    return createSuccessResponse(formatted);
  } catch (error) {
    console.error('Error in getUserAdminRequests:', error);
    return createErrorResponse(error);
  }
};

/**
 * Check if user is admin for a specific organization
 */
export const checkIsOrganizationAdmin = async (
  userId: string,
  organizationId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('profile_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_approved', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if user is organization admin:', error);
      return createErrorResponse(error);
    }
    
    return createSuccessResponse(!!data);
  } catch (error) {
    console.error('Error in checkIsOrganizationAdmin:', error);
    return createErrorResponse(error);
  }
};

/**
 * Get user's role in an organization
 */
export const getOrganizationRole = async (
  userId: string,
  organizationId: string
): Promise<ApiResponse<string | null>> => {
  try {
    const { data, error } = await supabase
      .from('organization_admins')
      .select('role')
      .eq('profile_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_approved', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking organization role:', error);
      return createErrorResponse(error);
    }
    
    return createSuccessResponse(data?.role || null);
  } catch (error) {
    console.error('Error in getOrganizationRole:', error);
    return createErrorResponse(error);
  }
};

/**
 * Create a new organization admin request
 */
export const createAdminRequest = async (request: {
  profile_id: string;
  organization_id: string;
  role?: string;
}): Promise<ApiResponse<boolean>> => {
  try {
    const VALID_ROLES = ['owner', 'admin', 'editor'];
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
      if (error.message.includes('organization_admins_role_check')) {
        throw new Error(`Invalid role: "${role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
      }
      throw error;
    }
    
    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error in createAdminRequest:', error);
    return createErrorResponse(error);
  }
};

/**
 * Update an organization admin request
 */
export const updateAdminRequest = async (
  requestId: string,
  updates: Partial<OrganizationAdmin>
): Promise<ApiResponse<boolean>> => {
  try {
    const VALID_ROLES = ['owner', 'admin', 'editor'];
    
    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      throw new Error(`Invalid role: "${updates.role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
    }
    
    const { error } = await supabase
      .from('organization_admins')
      .update(updates)
      .eq('id', requestId);
    
    if (error) {
      if (error.message.includes('organization_admins_role_check')) {
        throw new Error(`Invalid role: "${updates.role}". Valid roles are: ${VALID_ROLES.join(', ')}`);
      }
      throw error;
    }
    
    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error in updateAdminRequest:', error);
    return createErrorResponse(error);
  }
};

/**
 * Delete an organization admin request
 */
export const deleteAdminRequest = async (requestId: string): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('organization_admins')
      .delete()
      .eq('id', requestId);
    
    if (error) {
      throw error;
    }
    
    return createSuccessResponse(true);
  } catch (error) {
    console.error('Error in deleteAdminRequest:', error);
    return createErrorResponse(error);
  }
};

// Export individual operations
export const {
  getAll: getAllOrganizationAdminsBase,
  getById: getOrganizationAdminById,
  getByIds: getOrganizationAdminsByIds,
  create: createOrganizationAdmin,
  update: updateOrganizationAdmin,
  delete: deleteOrganizationAdmin
} = organizationAdminApi;
