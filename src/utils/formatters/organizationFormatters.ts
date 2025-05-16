
import { OrganizationWithLocation, ProfileOrganizationRelationshipType } from "@/types";

/**
 * Format organization data for display
 */
export function formatOrganizationWithLocation(data: any): OrganizationWithLocation | null {
  if (!data) return null;
  
  const organization = data as OrganizationWithLocation;
  
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
export function formatConnectionType(type: ProfileOrganizationRelationshipType | null | undefined): string {
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
  
  const admin = { ...data };
  
  // Format the profile name if available
  if (admin.profile) {
    admin.profile.full_name = [admin.profile.first_name, admin.profile.last_name]
      .filter(Boolean)
      .join(' ');
  }
  
  return admin;
}
