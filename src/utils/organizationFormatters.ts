
import { OrganizationWithLocation, ProfileOrganizationRelationship, ProfileOrganizationRelationshipWithDetails } from "@/types";
import { formatLocationWithDetails } from "@/utils/adminFormatters";

/**
 * Format organization relationships to ensure they meet the ProfileOrganizationRelationshipWithDetails type
 * @param relationships - The raw relationships from the database
 * @returns Formatted relationships with proper location details
 */
export const formatOrganizationRelationships = (
  relationships: ProfileOrganizationRelationship[]
): ProfileOrganizationRelationshipWithDetails[] => {
  return relationships.map(rel => {
    // Ensure the organization and its location have the expected structure
    const organization = rel.organization ? {
      ...rel.organization,
      location: rel.organization.location 
        ? formatLocationWithDetails(rel.organization.location) 
        : undefined
    } : undefined;
    
    return {
      ...rel,
      organization: organization as OrganizationWithLocation
    };
  });
};

/**
 * Filter out organizations that the user already has a relationship with
 * @param allOrganizations - All available organizations
 * @param userRelationships - User's current relationships
 * @returns Organizations that the user is not yet connected to
 */
export const filterAvailableOrganizations = (
  allOrganizations: OrganizationWithLocation[],
  userRelationships: ProfileOrganizationRelationship[]
): OrganizationWithLocation[] => {
  return allOrganizations.filter(
    org => !userRelationships.some(rel => rel.organization_id === org.id)
  );
};
