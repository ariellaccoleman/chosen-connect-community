
import { Profile, ProfileWithDetails } from "@/types/profile";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { formatProfileWithDetails } from "@/utils/formatters/profileFormatters";

/**
 * Factory for profile API operations
 */
export const profileApi = createApiFactory<
  ProfileWithDetails,
  string,
  Partial<Profile>,
  Partial<Profile>
>({
  tableName: 'profiles',
  entityName: 'Profile',
  idField: 'id',
  defaultSelect: `*, location:locations(*)`,
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => formatProfileWithDetails(data),
  transformRequest: (data) => {
    // Clean up data for insert/update
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects and UI-specific fields
    delete cleanedData.location;
    delete cleanedData.tags;
    delete cleanedData.fullName;
    delete cleanedData.role;
    
    // Transform camelCase to snake_case for database
    if (cleanedData.firstName !== undefined) {
      cleanedData.first_name = cleanedData.firstName;
      delete cleanedData.firstName;
    }
    
    if (cleanedData.lastName !== undefined) {
      cleanedData.last_name = cleanedData.lastName;
      delete cleanedData.lastName;
    }
    
    if (cleanedData.avatarUrl !== undefined) {
      cleanedData.avatar_url = cleanedData.avatarUrl;
      delete cleanedData.avatarUrl;
    }
    
    if (cleanedData.websiteUrl !== undefined) {
      cleanedData.website_url = cleanedData.websiteUrl;
      delete cleanedData.websiteUrl;
    }
    
    if (cleanedData.twitterUrl !== undefined) {
      cleanedData.twitter_url = cleanedData.twitterUrl;
      delete cleanedData.twitterUrl;
    }
    
    if (cleanedData.linkedinUrl !== undefined) {
      cleanedData.linkedin_url = cleanedData.linkedinUrl;
      delete cleanedData.linkedinUrl;
    }
    
    if (cleanedData.isApproved !== undefined) {
      cleanedData.is_approved = cleanedData.isApproved;
      delete cleanedData.isApproved;
    }
    
    if (cleanedData.locationId !== undefined) {
      cleanedData.location_id = cleanedData.locationId;
      delete cleanedData.locationId;
    }
    
    // Remove form UI fields
    delete cleanedData.addOrganizationRelationship;
    delete cleanedData.navigateToManageOrgs;
    
    // Ensure updated_at is set for updates
    if (!cleanedData.updated_at) {
      cleanedData.updated_at = new Date().toISOString();
    }
    
    return cleanedData;
  }
});

// Export specific operations for more granular imports
export const {
  getAll: getAllProfiles,
  getById: getProfileById,
  getByIds: getProfilesByIds,
  create: createProfile,
  update: updateProfile,
  delete: deleteProfile
} = profileApi;
