
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
   * The base repository to delegate database operations to
   */
  protected baseRepository: BaseRepository<Organization>;

  /**
   * Create a new OrganizationRepository
   * 
   * @param tableName The table name
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<Organization>) {
    super(tableName, entityType);
    this.baseRepository = baseRepository;
  }

  /**
   * Delegate select operation to base repository
   */
  select(columns?: string): BaseRepository<Organization> {
    return this.baseRepository.select(columns);
  }

  /**
   * Delegate insert operation to base repository
   */
  insert(values: Partial<Organization> | Partial<Organization>[]): BaseRepository<Organization> {
    return this.baseRepository.insert(values);
  }

  /**
   * Delegate update operation to base repository
   */
  update(values: Partial<Organization>): BaseRepository<Organization> {
    return this.baseRepository.update(values);
  }

  /**
   * Delegate delete operation to base repository
   */
  delete(): BaseRepository<Organization> {
    return this.baseRepository.delete();
  }

  /**
   * Convert database record to Organization entity
   */
  convertToEntity(record: any): Organization {
    const organization: Organization = {
      id: record.id,
      entityType: EntityType.ORGANIZATION,
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
    
    return organization;
  }

  /**
   * Convert Organization entity to database record
   */
  convertFromEntity(entity: Organization): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      website_url: entity.website_url,
      logo_url: entity.logo_url,
      logo_api_url: entity.logo_api_url,
      is_verified: entity.is_verified,
      location_id: entity.location_id,
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
