
import { OrganizationWithLocation, OrganizationAdminWithDetails } from "@/types/organization";
import { formatLocationWithDetails } from "./locationFormatters";
import { formatProfileWithDetails } from "./profileFormatters";

// Helper function to create organization with location
export const formatOrganizationWithLocation = (organizationData: any): OrganizationWithLocation => {
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
    org.location = formatLocationWithDetails(organizationData.location);
  }
  
  return org;
};

// Format admin details
export const formatAdminWithDetails = (admin: any): OrganizationAdminWithDetails => {
  return {
    id: admin.id,
    profile_id: admin.profile_id,
    organization_id: admin.organization_id,
    role: admin.role || '',
    is_approved: admin.is_approved || false,
    created_at: admin.created_at || '',
    updated_at: admin.updated_at,
    can_edit_profile: admin.can_edit_profile,
    profile: formatProfileWithDetails(admin.profile),
    organization: formatOrganizationWithLocation(admin.organization)
  };
};
