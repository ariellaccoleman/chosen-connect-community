
import { Organization, OrganizationWithLocation } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { formatOrganizationWithLocation } from "@/utils/formatters/organizationFormatters";

/**
 * Cached organization API instance
 */
let cachedOrganizationApi: any = null;

/**
 * Factory for organization API operations
 */
function createOrganizationApiInstance(providedClient?: any) {
  return createApiFactory<
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
  }, providedClient);
}

// Initialize with default client
if (!cachedOrganizationApi) {
  cachedOrganizationApi = createOrganizationApiInstance();
}

export const organizationApi = cachedOrganizationApi;

/**
 * Reset organization API with authenticated client
 */
export function resetOrganizationApi(authenticatedClient: any) {
  cachedOrganizationApi = createOrganizationApiInstance(authenticatedClient);
  return cachedOrganizationApi;
}

// Export specific operations for more granular imports
export const {
  getAll: getAllOrganizations,
  getById: getOrganizationById,
  getByIds: getOrganizationsByIds,
  create: createOrganization,
  update: updateOrganization,
  delete: deleteOrganization
} = cachedOrganizationApi;
