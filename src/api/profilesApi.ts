
import { ProfileWithDetails } from "@/types";
import { apiClient } from "./core/apiClient";
import { ApiResponse, createSuccessResponse } from "./core/errorHandler";
import { formatProfileWithDetails } from "@/utils/formatters/profileFormatters";

/**
 * API module for profile-related operations
 */
export const profilesApi = {
  /**
   * Get profile data by user ID
   * @param userId The user ID
   * @returns The profile data or error
   */
  async getProfileById(userId: string): Promise<ApiResponse<ProfileWithDetails | null>> {
    return apiClient.query(async (client) => {
      const { data, error } = await client
        .from('profiles')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      const formattedProfile = data ? formatProfileWithDetails(data) : null;
      return createSuccessResponse(formattedProfile);
    });
  },
  
  /**
   * Get all community profiles with optional filters
   */
  async getCommunityProfiles(params: {
    search?: string;
    limit?: number;
    excludeId?: string;
    isApproved?: boolean;
  }): Promise<ApiResponse<ProfileWithDetails[]>> {
    return apiClient.query(async (client) => {
      let query = client
        .from("profiles")
        .select(`
          *,
          location:locations(*)
        `);
      
      // Apply filters
      if (params.isApproved !== false) {
        query = query.eq("is_approved", true);
      }

      if (params.search) {
        query = query.or(
          `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,headline.ilike.%${params.search}%`
        );
      }

      if (params.excludeId) {
        query = query.neq("id", params.excludeId);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const formattedProfiles = (data || []).map(profile => 
        formatProfileWithDetails(profile)
      );
      
      return createSuccessResponse(formattedProfiles);
    });
  },
  
  /**
   * Update a profile
   */
  async updateProfile(
    profileId: string, 
    profileData: Partial<ProfileWithDetails>
  ): Promise<ApiResponse<ProfileWithDetails | null>> {
    return apiClient.query(async (client) => {
      // Filter out non-profile fields that may come from form data
      const cleanedProfileData = { ...profileData };
      
      // Remove fields that are not part of the profiles table
      delete cleanedProfileData.addOrganizationRelationship;
      delete cleanedProfileData.navigateToManageOrgs;
      delete cleanedProfileData.location; // This is handled separately
      
      const { data, error } = await client
        .from('profiles')
        .update(cleanedProfileData)
        .eq('id', profileId)
        .select();
      
      if (error) throw error;
      
      const formattedProfile = data?.[0] ? formatProfileWithDetails(data[0]) : null;
      return createSuccessResponse(formattedProfile);
    });
  }
};
