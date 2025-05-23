
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
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => formatOrganizationWithLocation(data),
  transformRequest: (data) => {
    // Clean up data for insert/update
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects that should not be sent to the database
    delete cleanedData.location;
    delete cleanedData.tags;

    // Transform camelCase to snake_case for database
    if (cleanedData.websiteUrl !== undefined) {
      cleanedData.website_url = cleanedData.websiteUrl;
      delete cleanedData.websiteUrl;
    }
    
    if (cleanedData.logoUrl !== undefined) {
      cleanedData.logo_url = cleanedData.logoUrl;
      delete cleanedData.logoUrl;
    }
    
    if (cleanedData.logoApiUrl !== undefined) {
      cleanedData.logo_api_url = cleanedData.logoApiUrl;
      delete cleanedData.logoApiUrl;
    }
    
    if (cleanedData.isVerified !== undefined) {
      cleanedData.is_verified = cleanedData.isVerified;
      delete cleanedData.isVerified;
    }
    
    if (cleanedData.locationId !== undefined) {
      cleanedData.location_id = cleanedData.locationId;
      delete cleanedData.locationId;
    }
    
    if (cleanedData.createdAt !== undefined) {
      cleanedData.created_at = cleanedData.createdAt;
      delete cleanedData.createdAt;
    }
    
    if (cleanedData.updatedAt !== undefined) {
      cleanedData.updated_at = cleanedData.updatedAt;
      delete cleanedData.updatedAt;
    } else {
      // Ensure updated_at is set for updates
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
