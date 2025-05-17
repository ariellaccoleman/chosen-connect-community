
import { createRepository } from "./repositoryFactory";
import { createStandardOperations } from "./standardOperations";
import { createEnhancedRepository } from "./enhancedRepositoryFactory";
import { Organization, OrganizationWithLocation } from "@/types";
import { formatOrganizationWithLocation } from "@/utils/formatters/organizationFormatters";
import { ApiResponse, ApiError } from "../errorHandler";

/**
 * Example of how to create and use a basic repository
 */
export function createBasicOrganizationRepository() {
  // Create a basic repository for the organizations table
  const repository = createRepository<Organization>("organizations");
  
  return {
    /**
     * Get an organization by ID
     */
    async getById(id: string): Promise<ApiResponse<Organization | null>> {
      try {
        const result = await repository.getById(id);
        return {
          data: result,
          status: "success",
          error: null
        };
      } catch (error) {
        return {
          data: null,
          status: "error",
          error: { 
            message: "Failed to retrieve organization"
          } as ApiError
        };
      }
    },
    
    /**
     * Get all organizations
     */
    async getAll(): Promise<ApiResponse<Organization[]>> {
      try {
        const results = await repository.getAll();
        return {
          data: results,
          status: "success",
          error: null
        };
      } catch (error) {
        return {
          data: [],
          status: "error",
          error: { 
            message: "Failed to retrieve organizations"
          } as ApiError
        };
      }
    }
  };
}

/**
 * Example of using standard repository operations
 */
export function createStandardOrganizationRepository() {
  const repository = createRepository<Organization>("organizations");
  const operations = createStandardOperations<Organization>(repository, "Organization");
  
  return {
    ...operations,
    
    /**
     * Get organizations by location
     */
    async getByLocation(locationId: string): Promise<ApiResponse<Organization[]>> {
      try {
        const result = await repository
          .select()
          .eq("location_id", locationId)
          .execute();
          
        if (result.error) throw result.error;
        
        return {
          data: result.data || [],
          status: "success",
          error: null
        };
      } catch (error) {
        return {
          data: [],
          status: "error",
          error: { 
            message: "Failed to retrieve organizations by location"
          } as ApiError
        };
      }
    }
  };
}

/**
 * Example of using the enhanced repository with transformations
 */
export function createEnhancedOrganizationRepository() {
  const repository = createEnhancedRepository<OrganizationWithLocation>(
    "organizations",
    "supabase",
    undefined,
    {
      defaultSelect: "*, location:locations(*)",
      transformResponse: formatOrganizationWithLocation,
      transformRequest: (data: Partial<OrganizationWithLocation>) => {
        // Clean up data for insert/update
        const cleanedData: Record<string, any> = { ...data };
        
        // Remove nested objects that should not be sent to the database
        delete cleanedData.location;
        delete cleanedData.tags;
        
        // Ensure updated_at is set for updates
        if (!cleanedData.updated_at) {
          cleanedData.updated_at = new Date().toISOString();
        }
        
        return cleanedData;
      },
      enableLogging: true
    }
  );
  
  const operations = createStandardOperations<OrganizationWithLocation>(
    repository, 
    "Organization"
  );
  
  return {
    ...operations,
    
    /**
     * Get verified organizations
     */
    async getVerifiedOrganizations(): Promise<ApiResponse<OrganizationWithLocation[]>> {
      try {
        const result = await repository
          .select()
          .eq("is_verified", true)
          .order("name")
          .execute();
          
        if (result.error) throw result.error;
        
        return {
          data: result.data || [],
          status: "success",
          error: null
        };
      } catch (error) {
        return {
          data: [],
          status: "error", 
          error: { 
            message: "Failed to retrieve verified organizations" 
          } as ApiError
        };
      }
    },
    
    /**
     * Search organizations by name
     */
    async searchByName(query: string): Promise<ApiResponse<OrganizationWithLocation[]>> {
      try {
        const result = await repository
          .select()
          .ilike("name", `%${query}%`)
          .order("name")
          .execute();
          
        if (result.error) throw result.error;
        
        return {
          data: result.data || [],
          status: "success",
          error: null
        };
      } catch (error) {
        return {
          data: [],
          status: "error",
          error: { 
            message: "Failed to search organizations" 
          } as ApiError
        };
      }
    }
  };
}
