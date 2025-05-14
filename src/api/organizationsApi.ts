import { 
  OrganizationWithLocation, 
  ProfileOrganizationRelationship, 
  ProfileOrganizationRelationshipWithDetails,
  Organization
} from "@/types";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";
import { formatOrganizationRelationships } from "@/utils/organizationFormatters";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { logger } from "@/utils/logger";

/**
 * API module for organization-related operations
 */
export const organizationsApi = {
  /**
   * Get all organizations
   */
  async getAllOrganizations(): Promise<ApiResponse<OrganizationWithLocation[]>> {
    logger.info("API call: getAllOrganizations");
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('name');
      
      if (error) {
        logger.error("Error fetching all organizations:", error);
        throw error;
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} organizations`);
      
      const formattedOrganizations = (data || []).map(org => {
        if (org.location) {
          return {
            ...org,
            location: formatLocationWithDetails(org.location)
          };
        }
        return org;
      }) as OrganizationWithLocation[];
      
      return createSuccessResponse(formattedOrganizations);
    });
  },
  
  /**
   * Get organization by ID
   */
  async getOrganizationById(id?: string): Promise<ApiResponse<OrganizationWithLocation | null>> {
    logger.info(`API call: getOrganizationById with ID: "${id}"`);
    
    if (!id) {
      logger.error("getOrganizationById was called with a falsy ID value");
      return createSuccessResponse(null);
    }
    
    return apiClient.query(async (client) => {
      // Log the exact query we're about to make
      logger.info(`Executing query to fetch organization with ID: "${id}"`);
      
      const { data, error } = await client
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        logger.error(`Error fetching organization with ID ${id}:`, error);
        throw error;
      }
      
      if (data) {
        logger.info(`Found organization data for ID ${id}:`, { 
          name: data.name, 
          id: data.id 
        });
        
        const formattedOrg = {
          ...data,
          location: data.location ? formatLocationWithDetails(data.location) : undefined
        } as OrganizationWithLocation;
        
        return createSuccessResponse(formattedOrg);
      } else {
        logger.warn(`No organization found with ID "${id}"`);
        return createSuccessResponse(null);
      }
    });
  },
  
  /**
   * Get organization relationships for a user
   */
  async getUserOrganizationRelationships(
    profileId: string
  ): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>> {
    logger.info(`API call: getUserOrganizationRelationships for profileId: ${profileId}`);
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('org_relationships')
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('profile_id', profileId);
      
      if (error) {
        logger.error(`Error fetching organization relationships for profile ${profileId}:`, error);
        throw error;
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} organization relationships for profileId: ${profileId}`);
      
      const formattedRelationships = formatOrganizationRelationships(data);
      return createSuccessResponse(formattedRelationships);
    });
  },
  
  /**
   * Add an organization relationship
   */
  async addOrganizationRelationship(
    relationship: Partial<ProfileOrganizationRelationship>
  ): Promise<ApiResponse<boolean>> {
    logger.info(`API call: addOrganizationRelationship`, relationship);
    return apiClient.query(async (client) => {
      if (!relationship.profile_id) {
        throw new Error('Profile ID is required');
      }
      
      // First check if profile exists
      const { data: existingProfile, error: profileCheckError } = await client
        .from('profiles')
        .select('id')
        .eq('id', relationship.profile_id)
        .maybeSingle();
      
      if (profileCheckError) throw profileCheckError;
      
      // If profile doesn't exist, create a minimal one
      if (!existingProfile) {
        logger.info(`Profile ${relationship.profile_id} doesn't exist, creating new profile`);
        const { error: profileCreateError } = await client
          .from('profiles')
          .insert({ id: relationship.profile_id });
        
        if (profileCreateError) throw profileCreateError;
      }
      
      // Create relationship
      logger.info(`Creating organization relationship`, relationship);
      const { error } = await client
        .from('org_relationships')
        .insert({
          profile_id: relationship.profile_id,
          organization_id: relationship.organization_id,
          connection_type: relationship.connection_type,
          department: relationship.department,
          notes: relationship.notes
        });
      
      if (error) throw error;
      
      logger.info(`Successfully created organization relationship`);
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Update an organization relationship
   */
  async updateOrganizationRelationship(
    relationshipId: string,
    relationshipData: Partial<ProfileOrganizationRelationship>
  ): Promise<ApiResponse<boolean>> {
    logger.info(`API call: updateOrganizationRelationship for ID: ${relationshipId}`, relationshipData);
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('org_relationships')
        .update({
          connection_type: relationshipData.connection_type,
          department: relationshipData.department,
          notes: relationshipData.notes
        })
        .eq('id', relationshipId);
      
      if (error) {
        logger.error(`Error updating organization relationship ${relationshipId}:`, error);
        throw error;
      }
      
      logger.info(`Successfully updated organization relationship ${relationshipId}`);
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Delete an organization relationship
   */
  async deleteOrganizationRelationship(relationshipId: string): Promise<ApiResponse<boolean>> {
    logger.info(`API call: deleteOrganizationRelationship for ID: ${relationshipId}`);
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('org_relationships')
        .delete()
        .eq('id', relationshipId);
      
      if (error) {
        logger.error(`Error deleting organization relationship ${relationshipId}:`, error);
        throw error;
      }
      
      logger.info(`Successfully deleted organization relationship ${relationshipId}`);
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Update an organization's details
   */
  async updateOrganization(
    orgId: string,
    data: Partial<Organization>
  ): Promise<ApiResponse<boolean>> {
    logger.info(`API call: updateOrganization for ID: ${orgId}`, data);
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('organizations')
        .update({
          name: data.name,
          description: data.description,
          website_url: data.website_url,
          logo_url: data.logo_url,
          updated_at: data.updated_at || new Date().toISOString(),
        })
        .eq('id', orgId);
      
      if (error) {
        logger.error(`Error updating organization ${orgId}:`, error);
        throw error;
      }
      
      logger.info(`Successfully updated organization ${orgId}`);
      return createSuccessResponse(true);
    });
  }
};
