
import { Organization, OrganizationWithLocation, LocationWithDetails } from "@/types";

/**
 * Format an organization with its location data
 */
export function formatOrganizationWithLocation(data: any): OrganizationWithLocation {
  if (!data) return data;
  
  const organization: OrganizationWithLocation = { ...data };
  
  // Format location if available
  if (organization.location) {
    const location = organization.location as LocationWithDetails;
    
    // Add formatted location string if not already present
    if (!location.formatted_location) {
      location.formatted_location = [location.city, location.region, location.country]
        .filter(Boolean)
        .join(', ');
    }
    
    organization.location = location;
  }
  
  return organization;
}

/**
 * Format organization data for API requests
 */
export function formatOrganizationForRequest(
  organization: Partial<Organization>
): Record<string, any> {
  const formattedData = { ...organization };
  
  // Remove properties that aren't stored in the database
  delete (formattedData as any).location;
  delete (formattedData as any).tags;
  
  // Ensure updated_at is set
  if (!formattedData.updated_at) {
    formattedData.updated_at = new Date().toISOString();
  }
  
  return formattedData;
}
