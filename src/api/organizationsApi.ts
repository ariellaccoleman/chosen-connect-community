
import { 
  OrganizationWithLocation, 
  ProfileOrganizationRelationship, 
  ProfileOrganizationRelationshipWithDetails 
} from "@/types";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";
import { formatOrganizationRelationships } from "@/utils/organizationFormatters";
import { formatLocationWithDetails } from "@/utils/formatters/locationFormatters";

/**
 * API module for organization-related operations
 */
export const organizationsApi = {
  /**
   * Get all organizations
   */
  async getAllOrganizations(): Promise<ApiResponse<OrganizationWithLocation[]>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('organizations')
        .select(`
          *,
          location:locations(*)
        `)
        .order('name');
      
      if (error) throw error;
      
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
  async getOrganizationById(id: string): Promise<ApiResponse<OrganizationWithLocation | null>> {
    console.log(`Fetching organization with ID: ${id}`);
    
    if (!id) {
      console.error("getOrganizationById was called with a falsy ID value");
      return createSuccessResponse(null);
    }
    
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
        console.error(`Error fetching organization with ID ${id}:`, error);
        throw error;
      }
      
      let formattedOrg = null;
      
      if (data) {
        console.log(`Found organization data for ID ${id}:`, data);
        formattedOrg = {
          ...data,
          location: data.location ? formatLocationWithDetails(data.location) : undefined
        } as OrganizationWithLocation;
      } else {
        console.log(`No organization found with ID ${id}`);
      }
      
      return createSuccessResponse(formattedOrg);
    });
  },
  
  /**
   * Get organization relationships for a user
   */
  async getUserOrganizationRelationships(
    profileId: string
  ): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>> {
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
      
      if (error) throw error;
      
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
        const { error: profileCreateError } = await client
          .from('profiles')
          .insert({ id: relationship.profile_id });
        
        if (profileCreateError) throw profileCreateError;
      }
      
      // Create relationship
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
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('org_relationships')
        .update({
          connection_type: relationshipData.connection_type,
          department: relationshipData.department,
          notes: relationshipData.notes
        })
        .eq('id', relationshipId);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  },
  
  /**
   * Delete an organization relationship
   */
  async deleteOrganizationRelationship(relationshipId: string): Promise<ApiResponse<boolean>> {
    return apiClient.query(async (client) => {
      const { error } = await client
        .from('org_relationships')
        .delete()
        .eq('id', relationshipId);
      
      if (error) throw error;
      
      return createSuccessResponse(true);
    });
  }
};
