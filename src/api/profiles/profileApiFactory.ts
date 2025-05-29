
import { Profile, ProfileWithDetails } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { formatProfileWithDetails } from "@/utils/formatters/profileFormatters";

/**
 * Create profile API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
const createProfileApi = (providedClient?: any) => {
  return createApiFactory<
    ProfileWithDetails,
    string,
    Partial<Profile>,
    Partial<Profile>
  >({
    tableName: 'profiles',
    entityName: 'Profile',
    idField: 'id',
    defaultSelect: `*, location:locations(*)`,
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
  }, providedClient);
};

// For backward compatibility - lazy-loaded instance
let _profileApiInstance: any = null;

/**
 * Lazy-loaded profile API instance
 * Only created when first accessed to avoid early instantiation
 */
export const profileApi = new Proxy({} as any, {
  get(target, prop) {
    if (!_profileApiInstance) {
      _profileApiInstance = createProfileApi();
    }
    return _profileApiInstance[prop];
  }
});

// Export specific operations for more granular imports - these will also be lazy
export const getAllProfiles = (...args: any[]) => profileApi.getAll(...args);
export const getProfileById = (...args: any[]) => profileApi.getById(...args);
export const getProfilesByIds = (...args: any[]) => profileApi.getByIds(...args);
export const createProfile = (...args: any[]) => profileApi.create(...args);
export const updateProfile = (...args: any[]) => profileApi.update(...args);
export const deleteProfile = (...args: any[]) => profileApi.delete(...args);
