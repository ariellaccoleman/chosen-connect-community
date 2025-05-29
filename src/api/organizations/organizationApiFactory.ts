

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
  defaultSelect: `*, location:locations(*)`,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => formatOrganizationWithLocation(data),
  transformRequest: (data) => {
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
  }
});

// Export specific operations for more granular imports
export const {
  getAll: getAllOrganizations,
  getById: getOrganizationById,
  getByIds: getOrganizationsByIds,
  create: createOrganization,
  update: updateOrganization,
  delete: deleteOrganization
} = organizationApi;
