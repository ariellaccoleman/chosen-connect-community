
/**
 * API module for organization tag-related operations
 */
import { apiClient } from "../core/apiClient";
import { TagAssignment } from "@/utils/tags";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { logger } from "@/utils/logger";

export const organizationTagsApi = {
  /**
   * Get all tags assigned to an organization
   */
  async getOrganizationTags(organizationId: string): Promise<ApiResponse<TagAssignment[]>> {
    logger.info(`API call: getOrganizationTags for organization ID: ${organizationId}`);
    
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_type', 'organization')
        .eq('target_id', organizationId);

      if (error) {
        logger.error(`Error fetching tags for organization ${organizationId}:`, error);
        throw error;
      }

      logger.info(`Successfully fetched ${data?.length || 0} tags for organization ${organizationId}`);
      return createSuccessResponse(data || []);
    });
  },

  /**
   * Add a tag to an organization
   */
  async addTagToOrganization(organizationId: string, tagId: string): Promise<ApiResponse<boolean>> {
    logger.info(`API call: addTagToOrganization for organization ID: ${organizationId}, tag ID: ${tagId}`);
    
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('tag_assignments')
        .insert({
          target_type: 'organization',
          target_id: organizationId,
          tag_id: tagId
        });

      if (error) {
        logger.error(`Error adding tag ${tagId} to organization ${organizationId}:`, error);
        throw error;
      }

      logger.info(`Successfully added tag ${tagId} to organization ${organizationId}`);
      return createSuccessResponse(true);
    });
  },

  /**
   * Remove a tag from an organization
   */
  async removeTagFromOrganization(assignmentId: string): Promise<ApiResponse<boolean>> {
    logger.info(`API call: removeTagFromOrganization for assignment ID: ${assignmentId}`);
    
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('tag_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        logger.error(`Error removing tag assignment ${assignmentId}:`, error);
        throw error;
      }

      logger.info(`Successfully removed tag assignment ${assignmentId}`);
      return createSuccessResponse(true);
    });
  }
};
