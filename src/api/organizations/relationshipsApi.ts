import { 
  ProfileOrganizationRelationship, 
  ProfileOrganizationRelationshipWithDetails 
} from "@/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { formatOrganizationRelationships } from "@/utils/organizationFormatters";
import { logger } from "@/utils/logger";

/**
 * API module for organization relationship operations
 */
export const organizationRelationshipsApi = {
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
      
      const formattedRelationships = formatOrganizationRelationships(data || []);
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
      
      // Create relationship directly - let the database handle any profile requirements
      // The test setup should ensure profiles exist, and in production, profiles are created via auth triggers
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
  }
};
