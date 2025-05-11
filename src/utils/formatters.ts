
import { Location, OrganizationAdminWithDetails, ProfileWithDetails, LocationWithDetails, OrganizationWithLocation } from "@/types";

// Format location object to a readable string
export const formatLocation = (location: Location | null | undefined): string => {
  if (!location) return "";
  
  return [location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
};

// Format website URL to ensure it has https://
export const formatWebsiteUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

// Helper function to create a ProfileWithDetails from response data
export const formatProfileWithDetails = (profileData: any): ProfileWithDetails => {
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
export const formatLocationWithDetails = (locationData: any): LocationWithDetails | undefined => {
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
