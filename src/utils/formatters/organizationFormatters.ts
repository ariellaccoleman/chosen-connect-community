
import { ProfileOrganizationRelationshipWithDetails, OrganizationAdminWithDetails } from "@/types";
import { formatLocationWithDetails } from "./locationFormatters";

/**
 * Format organization relationships to include properly formatted location data
 */
export const formatOrganizationRelationships = (
  relationships: any[]
): ProfileOrganizationRelationshipWithDetails[] => {
  return relationships.map(relationship => {
    if (relationship.organization && relationship.organization.location) {
      return {
        ...relationship,
        organization: {
          ...relationship.organization,
          location: formatLocationWithDetails(relationship.organization.location)
        }
      };
    }
    return relationship;
  }) as ProfileOrganizationRelationshipWithDetails[];
};

/**
 * Format connection type for display
 */
export const formatConnectionType = (connectionType: string | null | undefined): string => {
  if (!connectionType) return 'Connected';
  
  switch (connectionType) {
    case 'current':
      return 'Current Employee';
    case 'former':
      return 'Former Employee';
    case 'connected_insider':
      return 'Connected Insider';
    default:
      return connectionType.charAt(0).toUpperCase() + connectionType.slice(1).replace('_', ' ');
  }
};

/**
 * Format admin details including profile data
 */
export const formatAdminWithDetails = (admin: any): OrganizationAdminWithDetails => {
  // Process organization with location data if it exists
  const organization = admin.organization ? {
    ...admin.organization,
    location: admin.organization.location ? 
      formatLocationWithDetails(admin.organization.location) : 
      undefined
  } : undefined;
  
  return {
    ...admin,
    organization
  } as OrganizationAdminWithDetails;
};
