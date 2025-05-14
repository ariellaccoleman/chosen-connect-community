
import { Organization, OrganizationWithLocation } from "@/types";
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { logger } from "@/utils/logger";

/**
 * API module for organization operations
 */
export const organizationCrudApi = {
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
