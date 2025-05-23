
import { Profile, ProfileWithDetails } from "@/types";
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
    delete cleanedData.full_name;
    delete cleanedData.role;
    
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
