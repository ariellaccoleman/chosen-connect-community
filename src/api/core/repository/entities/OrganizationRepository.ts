
import { EntityRepository } from '../EntityRepository';
import { Organization } from '@/types/organization';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';

/**
 * Repository for managing Organization entities
 */
export class OrganizationRepository extends EntityRepository<Organization> {
  /**
   * Convert database record to Organization entity
   */
  convertToEntity(record: any): Organization {
    return {
      id: record.id,
      entityType: EntityType.ORGANIZATION,
      name: record.name,
      description: record.description || '',
      websiteUrl: record.website_url || '',
      logoUrl: record.logo_url || '',
      logoApiUrl: record.logo_api_url || '',
      isVerified: record.is_verified || false,
      locationId: record.location_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
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
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
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
        return {
          data: result.data.map(record => this.convertToEntity(record)),
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => null
        };
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
}
