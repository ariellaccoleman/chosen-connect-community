
import { Profile, ProfileWithDetails } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { createViewApiFactory } from "@/api/core/factory/viewApiFactory";
import { formatProfileWithDetails } from "@/utils/formatters/profileFormatters";

/**
 * Standard profile API for CRUD operations on the profiles table
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

/**
 * Profile view API for read-only operations with tag filtering and search
 */
export const profileViewApi = createViewApiFactory<ProfileWithDetails>({
  viewName: 'people_with_tags',
  entityName: 'Profile',
  defaultSelect: '*',
  transformResponse: (data) => formatProfileWithDetails(data)
});

/**
 * Composite profile API that combines CRUD and view operations
 */
export const profileCompositeApi = {
  // CRUD operations from table API
  ...profileApi,
  
  // View operations for enhanced querying
  search: profileViewApi.search,
  filterByTagIds: profileViewApi.filterByTagIds,
  filterByTagNames: profileViewApi.filterByTagNames
};

/**
 * Reset profile API with authenticated client
 */
export const resetProfileApi = (client?: any) => {
  const newTableApi = createApiFactory<
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
  }, client);

  const newViewApi = createViewApiFactory<ProfileWithDetails>({
    viewName: 'people_with_tags',
    entityName: 'Profile',
    defaultSelect: '*',
    transformResponse: (data) => formatProfileWithDetails(data)
  }, client);

  return {
    // CRUD operations
    ...newTableApi,
    
    // View operations
    search: newViewApi.search,
    filterByTagIds: newViewApi.filterByTagIds,
    filterByTagNames: newViewApi.filterByTagNames
  };
};

// Export specific operations for more granular imports
export const {
  getAll: getAllProfiles,
  getById: getProfileById,
  getByIds: getProfilesByIds,
  create: createProfile,
  update: updateProfile,
  delete: deleteProfile
} = profileApi;
