
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { apiClient } from '@/api/core/apiClient';
import { ProfileOrganizationRelationship, ProfileOrganizationRelationshipWithDetails } from '@/types/profile';

/**
 * Factory for organization relationships API operations
 */
export const organizationRelationshipsApi = createApiFactory<
  ProfileOrganizationRelationshipWithDetails,
  string,
  Partial<ProfileOrganizationRelationship>,
  Partial<ProfileOrganizationRelationship>
>({
  tableName: 'org_relationships',
  entityName: 'OrganizationRelationship',
  idField: 'id',
  defaultSelect: `*, 
    organization:organizations(*,
      location:locations(*)
    )`,
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false,
  
  transformResponse: (data) => {
    // Convert snake_case to camelCase for the client
    const transformed: ProfileOrganizationRelationshipWithDetails = {
      id: data.id,
      profileId: data.profile_id,
      organizationId: data.organization_id,
      connectionType: data.connection_type,
      department: data.department || null,
      notes: data.notes || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      organization: data.organization ? {
        id: data.organization.id,
        name: data.organization.name,
        logoUrl: data.organization.logo_url
      } : undefined
    };
    
    return transformed;
  },
  
  transformRequest: (data) => {
    // Convert camelCase to snake_case for the database
    const transformed: Record<string, any> = {};
    
    if (data.profileId !== undefined) transformed.profile_id = data.profileId;
    if (data.organizationId !== undefined) transformed.organization_id = data.organizationId;
    if (data.connectionType !== undefined) transformed.connection_type = data.connectionType;
    if (data.department !== undefined) transformed.department = data.department;
    if (data.notes !== undefined) transformed.notes = data.notes;
    
    return transformed;
  }
});

/**
 * Get relationships for a profile
 */
export async function getRelationshipsForProfile(profileId: string) {
  return organizationRelationshipsApi.query()
    .eq('profile_id', profileId)
    .execute();
}

/**
 * Get relationships for an organization
 */
export async function getRelationshipsForOrganization(organizationId: string) {
  return organizationRelationshipsApi.query()
    .eq('organization_id', organizationId)
    .execute();
}

/**
 * Create a relationship between profile and organization
 */
export async function createRelationship(relationship: Partial<ProfileOrganizationRelationship>) {
  return organizationRelationshipsApi.create(relationship);
}

/**
 * Update a relationship
 */
export async function updateRelationship(id: string, updates: Partial<ProfileOrganizationRelationship>) {
  return organizationRelationshipsApi.update(id, updates);
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(id: string) {
  return organizationRelationshipsApi.delete(id);
}

/**
 * Check if a relationship exists between profile and organization
 */
export async function checkRelationshipExists(profileId: string, organizationId: string) {
  const { data, error } = await apiClient.query(async (client) => {
    return client
      .from('org_relationships')
      .select('id')
      .eq('profile_id', profileId)
      .eq('organization_id', organizationId)
      .maybeSingle();
  });
  
  return { exists: !!data, relationshipId: data?.id };
}

// Export the API operations
export const {
  getAll: getAllRelationships,
  getById: getRelationshipById,
  create: createOrganizationRelationship,
  update: updateOrganizationRelationship,
  delete: deleteOrganizationRelationship
} = organizationRelationshipsApi;
