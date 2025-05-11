
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
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
