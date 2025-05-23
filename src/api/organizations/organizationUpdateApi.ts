
import { Organization } from "@/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { logger } from "@/utils/logger";

/**
 * API module for organization update operations
 */
export const organizationUpdateApi = {
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
          website_url: data.websiteUrl, // Fixed property name
          logo_url: data.logoUrl, // Fixed property name
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
