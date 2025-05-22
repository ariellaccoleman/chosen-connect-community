
import { EntityRepository } from '../EntityRepository';
import { Organization } from '@/types/organization';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { RepositoryResponse } from '../DataRepository';
import { createSuccessResponse, createErrorResponse } from '../repositoryUtils';

/**
 * OrganizationRepository class for specialized organization operations
 */
export class OrganizationRepository extends EntityRepository<Organization> {
  constructor() {
    super('organizations', EntityType.ORGANIZATION);
  }

  /**
   * Convert database record to Organization entity
   */
  convertToEntity(record: any): Organization {
    return {
      id: record.id,
      entityType: EntityType.ORGANIZATION,
      name: record.name || '',
      description: record.description || '',
      websiteUrl: record.website_url || '',
      logoUrl: record.logo_url || '',
      logoApiUrl: record.logo_api_url || '',
      isVerified: record.is_verified ?? false,
      locationId: record.location_id || null,
      createdAt: record.created_at ? new Date(record.created_at) : new Date(),
      updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
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
    };
  }

  /**
   * Find verified organizations
   */
  async findVerified(): Promise<Organization[]> {
    try {
      const result = await this.select()
        .eq('is_verified', true)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findVerified', error);
      return [];
    }
  }

  /**
   * Search organizations by name
   */
  async searchByName(query: string): Promise<Organization[]> {
    try {
      const result = await this.select()
        .ilike('name', `%${query}%`)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('searchByName', error, { query });
      return [];
    }
  }

  /**
   * Get organizations by location ID
   */
  async findByLocation(locationId: string): Promise<Organization[]> {
    try {
      const result = await this.select()
        .eq('location_id', locationId)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findByLocation', error, { locationId });
      return [];
    }
  }
}

