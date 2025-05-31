import { Organization, OrganizationWithLocation } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { formatOrganizationWithLocation } from "@/utils/formatters/organizationFormatters";

/**
 * Factory for organization API operations
 */
export const organizationApi = createApiFactory<
  OrganizationWithLocation,
  string,
  Partial<Organization>,
  Partial<Organization>
>({
  tableName: 'organizations',
  entityName: 'Organization',
  idField: 'id',
  defaultSelect: `
    *, 
    location:locations(*)
  `,
  withTagsView: 'organizations_with_tags',
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => {
    const formatted = formatOrganizationWithLocation(data);
    return formatted;
  },
  transformRequest: (data) => {
    // Clean up data for insert/update
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects that should not be sent to the database
    delete cleanedData.location;
    delete cleanedData.tags;
    delete cleanedData.tag_assignments;
    
    // Ensure updated_at is set for updates
    if (!cleanedData.updated_at) {
      cleanedData.updated_at = new Date().toISOString();
    }
    
    return cleanedData;
  }
});

/**
 * Reset organization API with authenticated client
 */
export const resetOrganizationApi = (client?: any) => {
  const newApi = createApiFactory<
    OrganizationWithLocation,
    string,
    Partial<Organization>,
    Partial<Organization>
  >({
    tableName: 'organizations',
    entityName: 'Organization',
    idField: 'id',
    defaultSelect: `
      *, 
      location:locations(*)
    `,
    withTagsView: 'organizations_with_tags',
    useMutationOperations: true,
    useBatchOperations: false,
    transformResponse: (data) => {
      const formatted = formatOrganizationWithLocation(data);
      return formatted;
    },
    transformRequest: (data) => {
      // Clean up data for insert/update
      const cleanedData: Record<string, any> = { ...data };
      
      // Remove nested objects that should not be sent to the database
      delete cleanedData.location;
      delete cleanedData.tags;
      delete cleanedData.tag_assignments;
      
      // Ensure updated_at is set for updates
      if (!cleanedData.updated_at) {
        cleanedData.updated_at = new Date().toISOString();
      }
      
      return cleanedData;
    }
  }, client);

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete
  };
};

// Export specific operations for more granular imports
export const {
  getAll: getAllOrganizations,
  getById: getOrganizationById,
  getByIds: getOrganizationsByIds,
  create: createOrganization,
  update: updateOrganization,
  delete: deleteOrganization
} = organizationApi;
