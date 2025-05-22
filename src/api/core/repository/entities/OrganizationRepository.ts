
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
      entityType: EntityType.ORGANIZATION, // Add entityType to satisfy Entity interface
      name: record.name,
      description: record.description || '',
      website_url: record.website_url || '',
      logo_url: record.logo_url || '',
      logo_api_url: record.logo_api_url || '',
      is_verified: record.is_verified || false,
      location_id: record.location_id,
      created_at: record.created_at,
      updated_at: record.updated_at,
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
    if (entity.website_url !== undefined) record.website_url = entity.website_url;
    if (entity.logo_url !== undefined) record.logo_url = entity.logo_url;
    if (entity.logo_api_url !== undefined) record.logo_api_url = entity.logo_api_url;
    if (entity.is_verified !== undefined) record.is_verified = entity.is_verified;
    if (entity.location_id !== undefined) record.location_id = entity.location_id;
    if (entity.created_at !== undefined) record.created_at = entity.created_at;
    if (entity.updated_at !== undefined) record.updated_at = entity.updated_at;
    
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
