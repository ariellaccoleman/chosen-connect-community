
import { Organization, OrganizationWithLocation } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { createViewApiFactory } from "@/api/core/factory/viewApiFactory";
import { formatOrganizationWithLocation } from "@/utils/formatters/organizationFormatters";

/**
 * Standard organization API for CRUD operations on the organizations table
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
  defaultSelect: `*, location:locations(*)`,
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
 * Organization view API for read-only operations with tag filtering and search
 */
export const organizationViewApi = createViewApiFactory<OrganizationWithLocation>({
  viewName: 'organizations_with_tags',
  entityName: 'Organization',
  defaultSelect: '*',
  transformResponse: (data) => formatOrganizationWithLocation(data)
});

/**
 * Composite organization API that combines CRUD and view operations
 */
export const organizationCompositeApi = {
  // CRUD operations from table API
  ...organizationApi,
  
  // View operations for enhanced querying
  search: organizationViewApi.search,
  filterByTagIds: organizationViewApi.filterByTagIds,
  filterByTagNames: organizationViewApi.filterByTagNames
};

/**
 * Reset organization API with authenticated client
 */
export const resetOrganizationApi = (client?: any) => {
  const newTableApi = createApiFactory<
    OrganizationWithLocation,
    string,
    Partial<Organization>,
    Partial<Organization>
  >({
    tableName: 'organizations',
    entityName: 'Organization',
    idField: 'id',
    defaultSelect: `*, location:locations(*)`,
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

  const newViewApi = createViewApiFactory<OrganizationWithLocation>({
    viewName: 'organizations_with_tags',
    entityName: 'Organization',
    defaultSelect: '*',
    transformResponse: (data) => formatOrganizationWithLocation(data)
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
  getAll: getAllOrganizations,
  getById: getOrganizationById,
  getByIds: getOrganizationsByIds,
  create: createOrganization,
  update: updateOrganization,
  delete: deleteOrganization
} = organizationApi;
