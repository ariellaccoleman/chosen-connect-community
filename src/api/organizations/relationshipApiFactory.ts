
import { createRelationshipApiFactory } from '@/api/core/factory/apiFactory';
import { OrganizationRelationshipOperations } from './types';
import { ProfileOrganizationRelationship, ProfileOrganizationRelationshipWithDetails } from '@/types';
import { organizationRelationshipsApi } from './relationshipsApi';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/types';

/**
 * Factory function to create organization relationship API using the relationship pattern
 * Combines relationship factory with organization-specific business operations
 */
export function createOrganizationRelationshipApi(client?: any): OrganizationRelationshipOperations {
  // Create the base relationship operations (RUD only, no generic create)
  const relationshipOps = createRelationshipApiFactory<ProfileOrganizationRelationship>({
    tableName: 'org_relationships',
    entityName: 'OrganizationRelationship',
    useMutationOperations: true,
    defaultSelect: '*',
    transformResponse: (item: any): ProfileOrganizationRelationship => ({
      id: item.id,
      profile_id: item.profile_id,
      organization_id: item.organization_id,
      connection_type: item.connection_type,
      department: item.department,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at
    }),
    // Relationship-specific configuration
    validateRelationship: (profileId: string, organizationId: string, connectionType?: string) => {
      return !!(profileId && organizationId && connectionType);
    },
    preventDuplicates: false, // Allow multiple relationships between same profile and org
    sourceEntityType: 'profile',
    targetEntityType: 'organization'
  }, client);
  
  // Combine relationship operations with organization-specific methods
  return {
    ...relationshipOps,
    
    /**
     * Create a relationship between a profile and organization
     */
    async createRelationship(
      profileId: string, 
      organizationId: string, 
      connectionType: string, 
      department?: string, 
      notes?: string
    ): Promise<ApiResponse<ProfileOrganizationRelationship>> {
      return organizationRelationshipsApi.addOrganizationRelationship({
        profile_id: profileId,
        organization_id: organizationId,
        connection_type: connectionType as any,
        department,
        notes
      }, client);
    },
    
    /**
     * Get all organization relationships for a profile
     */
    async getForProfile(profileId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>> {
      return organizationRelationshipsApi.getUserOrganizationRelationships(profileId, client);
    },
    
    /**
     * Get all profile relationships for an organization
     */
    async getForOrganization(organizationId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>> {
      // Use the base relationship operations to get relationships by organization
      const result = await relationshipOps.getAll({ 
        filters: { 
          organization_id: organizationId 
        } 
      });
      
      // Transform to include helper methods
      if (result.error) {
        return createErrorResponse(result.error);
      }
      
      return createSuccessResponse(result.data as ProfileOrganizationRelationshipWithDetails[]);
    }
  };
}

/**
 * Default organization relationship API instance
 * @deprecated Use createOrganizationRelationshipApi() factory function instead
 */
export const organizationRelationshipApi = createOrganizationRelationshipApi();
