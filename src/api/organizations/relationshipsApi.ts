import { 
  ProfileOrganizationRelationship, 
  ProfileOrganizationRelationshipWithDetails 
} from "@/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../core/errorHandler";
import { formatOrganizationRelationships } from "@/utils/organizationFormatters";
import { logger } from "@/utils/logger";

/**
 * Validate UUID format
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * API module for organization relationship operations
 */
export const organizationRelationshipsApi = {
  /**
   * Get organization relationships for a user
   */
  async getUserOrganizationRelationships(
    profileId: string,
    providedClient?: any
  ): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>> {
    logger.info(`API call: getUserOrganizationRelationships for profileId: ${profileId}`);
    
    // Validate UUID format
    if (!isValidUUID(profileId)) {
      logger.error(`Invalid UUID format for profileId: ${profileId}`);
      return createErrorResponse(new Error('Invalid profile ID format'));
    }
    
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
    }, providedClient);
  },
  
  /**
   * Add an organization relationship
   */
  async addOrganizationRelationship(
    relationship: Partial<ProfileOrganizationRelationship>,
    providedClient?: any
  ): Promise<ApiResponse<ProfileOrganizationRelationship>> {
    logger.info(`API call: addOrganizationRelationship`, relationship);
    
    return apiClient.query(async (client) => {
      if (!relationship.profile_id) {
        throw new Error('Profile ID is required');
      }
      
      // Create relationship directly - let the database handle any profile requirements
      // The test setup should ensure profiles exist, and in production, profiles are created via auth triggers
      logger.info(`Creating organization relationship`, relationship);
      const { data, error } = await client
        .from('org_relationships')
        .insert({
          profile_id: relationship.profile_id,
          organization_id: relationship.organization_id,
          connection_type: relationship.connection_type,
          department: relationship.department,
          notes: relationship.notes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      logger.info(`Successfully created organization relationship`);
      return createSuccessResponse(data as ProfileOrganizationRelationship);
    }, providedClient);
  },
  
  /**
   * Update an organization relationship
   */
  async updateOrganizationRelationship(
    relationshipId: string,
    relationshipData: Partial<ProfileOrganizationRelationship>,
    providedClient?: any
  ): Promise<ApiResponse<ProfileOrganizationRelationship>> {
    logger.info(`API call: updateOrganizationRelationship for ID: ${relationshipId}`, relationshipData);
    
    return apiClient.query(async (client) => {
      // First, check if the relationship exists
      const { data: existingRelationship, error: checkError } = await client
        .from('org_relationships')
        .select('id')
        .eq('id', relationshipId)
        .maybeSingle();
      
      if (checkError) {
        logger.error(`Error checking for existing relationship ${relationshipId}:`, checkError);
        throw checkError;
      }
      
      if (!existingRelationship) {
        logger.error(`Relationship ${relationshipId} does not exist`);
        throw new Error(`Relationship with ID ${relationshipId} not found`);
      }
      
      const { data: updatedRelationship, error } = await client
        .from('org_relationships')
        .update({
          connection_type: relationshipData.connection_type,
          department: relationshipData.department,
          notes: relationshipData.notes
        })
        .eq('id', relationshipId)
        .select()
        .single();
      
      if (error) {
        logger.error(`Error updating organization relationship ${relationshipId}:`, error);
        throw error;
      }
      
      logger.info(`Successfully updated organization relationship ${relationshipId}`);
      return createSuccessResponse(updatedRelationship as ProfileOrganizationRelationship);
    }, providedClient);
  },
  
  /**
   * Delete an organization relationship
   */
  async deleteOrganizationRelationship(
    relationshipId: string, 
    providedClient?: any
  ): Promise<ApiResponse<boolean>> {
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
    }, providedClient);
  }
};
