
import { EntityRepository } from '../EntityRepository';
import { Organization } from '@/types/organization';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';
import { createSuccessResponse } from '../repositoryUtils';
import { logger } from '@/utils/logger';

/**
 * Repository for managing Organization entities
 */
export class OrganizationRepository extends EntityRepository<Organization> {
  /**
   * Creates a new OrganizationRepository
   * @param baseRepository The base repository to use for database operations
   */
  constructor(baseRepository: BaseRepository<Organization>) {
    super('organizations', EntityType.ORGANIZATION, baseRepository);
  }

  /**
   * Convert database record to Organization entity
   */
  convertToEntity(record: any): Organization {
    // Convert timestamps to standard format
    const createdAt = record.created_at ? new Date(record.created_at).toISOString() : undefined;
    const updatedAt = record.updated_at ? new Date(record.updated_at).toISOString() : undefined;
    
    return {
      id: record.id,
      entityType: EntityType.ORGANIZATION,
      name: record.name || '',
      description: record.description || '',
      websiteUrl: record.website_url || '',
      logoUrl: record.logo_url || '',
      logoApiUrl: record.logo_api_url || '',
      isVerified: record.is_verified || false,
      locationId: record.location_id,
      created_at: createdAt,
      updated_at: updatedAt,
      
      // Include location if available
      location: record.location,
      
      // Include tags if available
      tags: record.tags || [],
    };
  }

  /**
   * Convert Organization entity to database record
   */
  convertFromEntity(entity: Organization): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      website_url: entity.websiteUrl,
      logo_url: entity.logoUrl,
      logo_api_url: entity.logoApiUrl,
      is_verified: entity.isVerified,
      location_id: entity.locationId,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  /**
   * Find organizations by name
   * @param name Name to search for
   */
  async findByName(name: string): Promise<RepositoryResponse<Organization[]>> {
    try {
      const result = await this.baseRepository.select()
        .ilike('name', `%${name}%`)
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<Organization[]>;
    } catch (error) {
      this.handleError('findByName', error, { name });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to find organizations by name: ${name}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to find organizations by name: ${name}`
      };
    }
  }

  /**
   * Get verified organizations
   */
  async getVerifiedOrganizations(): Promise<RepositoryResponse<Organization[]>> {
    try {
      const result = await this.baseRepository.select()
        .eq('is_verified', true)
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<Organization[]>;
    } catch (error) {
      this.handleError('getVerifiedOrganizations', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get verified organizations',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get verified organizations'
      };
    }
  }
}

/**
 * Create an organization repository instance
 * @param baseRepository Base repository to use for database operations
 * @returns Organization repository instance
 */
export function createOrganizationRepository(
  baseRepository: BaseRepository<Organization>
): OrganizationRepository {
  try {
    return new OrganizationRepository(baseRepository);
  } catch (error) {
    logger.error('Failed to create organization repository', error);
    throw error;
  }
}
