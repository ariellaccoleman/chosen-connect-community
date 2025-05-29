
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
    location:locations(*),
    tag_assignments:tag_assignments(
      id,
      created_at,
      updated_at,
      tag:tags(*)
    )
  `,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => {
    const formatted = formatOrganizationWithLocation(data);
    // Add tags from tag_assignments
    if (data.tag_assignments) {
      formatted.tags = data.tag_assignments;
    }
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

// Export specific operations for more granular imports
export const {
  getAll: getAllOrganizations,
  getById: getOrganizationById,
  getByIds: getOrganizationsByIds,
  create: createOrganization,
  update: updateOrganization,
  delete: deleteOrganization
} = organizationApi;
