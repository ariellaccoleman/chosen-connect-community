
import { EntityRepository } from '../EntityRepository';
import { Organization } from '@/types/organization';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';

/**
 * Repository for managing Organization entities
 */
export class OrganizationRepository extends EntityRepository<Organization> {
  /**
   * Create a new OrganizationRepository
   * 
   * @param tableName The table name
   * @param entityType The entity type
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<any>) {
    super(tableName, entityType, baseRepository);
  }

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
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * Convert Organization entity to database record
   */
  convertFromEntity(entity: Partial<Organization>): Record<string, any> {
    const record: Record<string, any> = {};
    
    if (entity.id !== undefined) record.id = entity.id;
    if (entity.name !== undefined) record.name = entity.name;
    if (entity.description !== undefined) record.description = entity.description;
    if (entity.websiteUrl !== undefined) record.website_url = entity.websiteUrl;
    if (entity.logoUrl !== undefined) record.logo_url = entity.logoUrl;
    if (entity.logoApiUrl !== undefined) record.logo_api_url = entity.logoApiUrl;
    if (entity.isVerified !== undefined) record.is_verified = entity.isVerified;
    if (entity.locationId !== undefined) record.location_id = entity.locationId;
    if (entity.createdAt !== undefined) record.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) record.updated_at = entity.updatedAt;
    
    return record;
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
      
      return result as unknown as RepositoryResponse<Organization[]>;
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
