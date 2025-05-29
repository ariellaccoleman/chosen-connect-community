
import { RelationshipApiOperations, ApiResponse } from '@/api/core/types';
import { ProfileOrganizationRelationship, ProfileOrganizationRelationshipWithDetails } from '@/types';

/**
 * Organization Relationship Operations Interface
 * Extends RelationshipApiOperations with organization-specific relationship methods
 */
export interface OrganizationRelationshipOperations extends RelationshipApiOperations<ProfileOrganizationRelationship, string, Partial<ProfileOrganizationRelationship>, Partial<ProfileOrganizationRelationship>> {
  /**
   * Create a relationship between a profile and organization
   */
  createRelationship(
    profileId: string, 
    organizationId: string, 
    connectionType: string, 
    department?: string, 
    notes?: string
  ): Promise<ApiResponse<ProfileOrganizationRelationship>>;
  
  /**
   * Get all organization relationships for a profile
   */
  getForProfile(profileId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>;
  
  /**
   * Get all profile relationships for an organization
   */
  getForOrganization(organizationId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>;
}
