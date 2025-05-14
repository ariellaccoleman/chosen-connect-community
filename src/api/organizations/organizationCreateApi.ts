
import { Organization } from "@/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { logger } from "@/utils/logger";

/**
 * API module for organization creation operations
 */
export const organizationCreateApi = {
  /**
   * Create a new organization and establish relationships
   */
  async createOrganization(
    data: {
      name: string;
      description?: string;
      website_url?: string;
    },
    userId: string
  ): Promise<ApiResponse<Organization>> {
    logger.info("API call: createOrganization", { data, userId });
    
    return apiClient.query(async (client) => {
      // First, ensure the user profile exists
      const { data: existingProfile, error: profileCheckError } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileCheckError) throw profileCheckError;
      
      // If profile doesn't exist, create a minimal one
      if (!existingProfile) {
        logger.info(`Profile ${userId} doesn't exist, creating new profile`);
        const { error: profileCreateError } = await client
          .from('profiles')
          .insert({ id: userId });
        
        if (profileCreateError) throw profileCreateError;
      }
      
      // Create organization
      logger.info("Creating new organization:", data);
      const { data: organizationData, error: orgError } = await client
        .from("organizations")
        .insert({
          name: data.name,
          description: data.description || null,
          website_url: data.website_url || null,
        })
        .select()
        .single();
        
      if (orgError) throw orgError;
      
      if (!organizationData) {
        throw new Error("Failed to create organization: No data returned");
      }
      
      // Make the creator an admin of the organization
      logger.info(`Creating admin relationship for org ${organizationData.id} and user ${userId}`);
      const { error: adminError } = await client
        .from("organization_admins")
        .insert({
          organization_id: organizationData.id,
          profile_id: userId,
          role: "owner",
          is_approved: true,
        });
        
      if (adminError) throw adminError;
      
      // Also create a relationship between the user and the org
      logger.info(`Creating organization relationship for org ${organizationData.id} and user ${userId}`);
      const { error: relationshipError } = await client
        .from("org_relationships")
        .insert({
          organization_id: organizationData.id,
          profile_id: userId,
          connection_type: "current",
        });
        
      if (relationshipError) throw relationshipError;

      logger.info("Successfully created organization with all relationships:", organizationData.id);
      return createSuccessResponse(organizationData);
    });
  }
};
