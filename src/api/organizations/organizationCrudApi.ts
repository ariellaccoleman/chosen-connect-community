
import { Organization, OrganizationWithLocation } from "@/types";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { logger } from "@/utils/logger";
import { apiClient } from "../core/apiClient";

/**
 * Organization CRUD API with client injection support
 */
export const organizationCrudApi = {
  /**
   * Get an organization by ID with location details
   */
  async getOrganizationById(id: string, providedClient?: any): Promise<ApiResponse<OrganizationWithLocation | null>> {
    logger.info(`API call: getOrganizationById for ID: ${id}`);
    
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        logger.error(`Error fetching organization ${id}:`, error);
        throw error;
      }
      
      if (!data) {
        logger.info(`Organization ${id} not found`);
        return createSuccessResponse(null);
      }

      // Format the organization with location details
      const formattedOrg: OrganizationWithLocation = {
        ...data,
        location: data.location ? formatLocationWithDetails(data.location) : null
      };
      
      logger.info(`Successfully fetched organization ${id}`);
      return createSuccessResponse(formattedOrg);
    }, providedClient);
  },

  /**
   * Get all organizations with optional filtering
   */
  async getAllOrganizations(filters?: any, providedClient?: any): Promise<ApiResponse<OrganizationWithLocation[]>> {
    logger.info("API call: getAllOrganizations", filters);
    
    return apiClient.query(async (client) => {
      let query = client
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      
      if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error("Error fetching organizations:", error);
        throw error;
      }
      
      // Format organizations with location details
      const formattedOrgs: OrganizationWithLocation[] = (data || []).map(org => ({
        ...org,
        location: org.location ? formatLocationWithDetails(org.location) : null
      }));
      
      logger.info(`Successfully fetched ${formattedOrgs.length} organizations`);
      return createSuccessResponse(formattedOrgs);
    }, providedClient);
  }
};
