
import { Organization, OrganizationWithLocation } from "@/types";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";
import { logger } from "@/utils/logger";
import { createRepository } from "../core/repository/repositoryFactory";

/**
 * API module for basic organization operations (get, getById)
 */
export const organizationCrudApi = {
  /**
   * Get all organizations
   */
  async getAllOrganizations(): Promise<ApiResponse<OrganizationWithLocation[]>> {
    logger.info("API call: getAllOrganizations");
    
    try {
      const repository = createRepository<Organization>('organizations');
      
      const { data, error } = await repository
        .select(`
          *,
          location:locations(*)
        `)
        .order('name', { ascending: true })
        .execute();
      
      if (error) {
        logger.error("Error fetching all organizations:", error);
        throw error;
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} organizations`);
      
      // Handle the nested location data that comes from the join
      const formattedOrganizations = (data || []).map(org => {
        // TypeScript doesn't know about the 'location' field as it's not in the Organization type
        // We need to use type assertion to access it
        const orgWithLocation = org as any;
        
        if (orgWithLocation.location) {
          return {
            ...org,
            location: formatLocationWithDetails(orgWithLocation.location)
          };
        }
        return org;
      }) as OrganizationWithLocation[];
      
      return createSuccessResponse(formattedOrganizations);
    } catch (error) {
      logger.error("Error in getAllOrganizations:", error);
      throw error;
    }
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
    
    try {
      const repository = createRepository<Organization>('organizations');
      
      // Log the exact query we're about to make
      logger.info(`Executing query to fetch organization with ID: "${id}"`);
      
      const { data, error } = await repository
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
        
        // Type assertion to handle the nested location data
        const orgWithLocation = data as any;
        
        const formattedOrg = {
          ...data,
          location: orgWithLocation.location ? formatLocationWithDetails(orgWithLocation.location) : undefined
        } as OrganizationWithLocation;
        
        return createSuccessResponse(formattedOrg);
      } else {
        logger.warn(`No organization found with ID "${id}"`);
        return createSuccessResponse(null);
      }
    } catch (error) {
      logger.error(`Error in getOrganizationById for ID ${id}:`, error);
      throw error;
    }
  }
};
