
import { OrganizationWithLocation } from "@/types";

/**
 * Format organization data for display
 */
export function formatOrganizationWithLocation(data: any): OrganizationWithLocation | null {
  if (!data) return null;
  
  // Transform snake_case to camelCase for client
  const organization: OrganizationWithLocation = {
    id: data.id,
    entityType: data.entity_type,
    name: data.name,
    description: data.description || '',
    websiteUrl: data.website_url || '',
    logoUrl: data.logo_url || '',
    logoApiUrl: data.logo_api_url || '',
    isVerified: data.is_verified || false,
    locationId: data.location_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    location: data.location ? {
      id: data.location.id,
      city: data.location.city || '',
      region: data.location.region || '',
      country: data.location.country || '',
    } : undefined
  };
  
  // Ensure we have location data formatted
  if (organization.location) {
    // Format location if it's already present
    const city = organization.location.city || '';
    const region = organization.location.region || '';
    const country = organization.location.country || '';
    
    // Add formatted location string
    (organization.location as any).formatted_location = [city, region, country]
      .filter(Boolean)
      .join(', ');
  }
  
  return organization;
}

/**
 * Format connection type for display
 */
export function formatConnectionType(type: "current" | "former" | "connected_insider" | null | undefined): string {
  switch (type) {
    case 'current':
      return 'Current';
    case 'former':
      return 'Former';
    case 'connected_insider':
      return 'Connected Insider';
    default:
      return 'Unknown';
  }
}

/**
 * Format admin details for display
 */
export function formatAdminWithDetails(data: any): any {
  if (!data) return null;
  
  // Convert snake_case to camelCase for client
  const admin = {
    id: data.id,
    profileId: data.profile_id,
    organizationId: data.organization_id,
    role: data.role,
    isApproved: data.is_approved,
    canEditProfile: data.can_edit_profile,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    profile: data.profile ? {
      id: data.profile.id,
      firstName: data.profile.first_name,
      lastName: data.profile.last_name,
      email: data.profile.email,
      avatarUrl: data.profile.avatar_url,
    } : undefined
  };
  
  // Format the profile name if available
  if (admin.profile) {
    admin.profile.fullName = [admin.profile.firstName, admin.profile.lastName]
      .filter(Boolean)
      .join(' ');
  }
  
  return admin;
}

/**
 * Format organization relationships for display
 */
export function formatOrganizationRelationships(data: any[]): any[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id,
    profileId: item.profile_id,
    organizationId: item.organization_id,
    connectionType: item.connection_type,
    department: item.department,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    organization: item.organization ? {
      id: item.organization.id,
      name: item.organization.name,
      description: item.organization.description,
      logoUrl: item.organization.logo_url,
      websiteUrl: item.organization.website_url,
      location: item.organization.location ? {
        id: item.organization.location.id,
        city: item.organization.location.city,
        region: item.organization.location.region,
        country: item.organization.location.country,
        formatted_location: [
          item.organization.location.city,
          item.organization.location.region,
          item.organization.location.country
        ].filter(Boolean).join(', ')
      } : null
    } : null
  }));
}
