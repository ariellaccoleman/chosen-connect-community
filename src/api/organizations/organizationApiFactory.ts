
import { Organization, OrganizationWithLocation } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { formatOrganizationWithLocation } from "@/utils/formatters/organizationFormatters";

/**
 * Create organization API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
const createOrganizationApi = (providedClient?: any) => {
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
};

// For backward compatibility - lazy-loaded instance
let _organizationApiInstance: any = null;

/**
 * Lazy-loaded organization API instance
 * Only created when first accessed to avoid early instantiation
 */
export const organizationApi = new Proxy({} as any, {
  get(target, prop) {
    if (!_organizationApiInstance) {
      _organizationApiInstance = createOrganizationApi();
    }
    return _organizationApiInstance[prop];
  }
});

// Export specific operations for more granular imports - these will also be lazy
export const getAllOrganizations = (...args: any[]) => organizationApi.getAll(...args);
export const getOrganizationById = (...args: any[]) => organizationApi.getById(...args);
export const getOrganizationsByIds = (...args: any[]) => organizationApi.getByIds(...args);
export const createOrganization = (...args: any[]) => organizationApi.create(...args);
export const updateOrganization = (...args: any[]) => organizationApi.update(...args);
export const deleteOrganization = (...args: any[]) => organizationApi.delete(...args);
