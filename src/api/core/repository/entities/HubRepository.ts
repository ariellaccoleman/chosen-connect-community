
import { EntityRepository } from '../EntityRepository';
import { Hub } from '@/types/hub';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';

/**
 * Repository for managing Hub entities
 */
export class HubRepository extends EntityRepository<Hub> {
  /**
   * Create a new HubRepository
   * 
   * @param tableName The table name
   * @param entityType The entity type
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<any>) {
    super(tableName, entityType, baseRepository);
  }

  /**
   * Convert database record to Hub entity
   */
  convertToEntity(record: any): Hub {
    return {
      id: record.id,
      name: record.name,
      entityType: EntityType.HUB, // Add entityType to satisfy Entity interface
      description: record.description || null,
      tag_id: record.tag_id || null,
      is_featured: record.is_featured || false,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  /**
   * Convert Hub entity to database record
   */
  convertFromEntity(entity: Partial<Hub>): Record<string, any> {
    const record: Record<string, any> = {};
    
    if (entity.id !== undefined) record.id = entity.id;
    if (entity.name !== undefined) record.name = entity.name;
    if (entity.description !== undefined) record.description = entity.description;
    if (entity.tag_id !== undefined) record.tag_id = entity.tag_id;
    if (entity.is_featured !== undefined) record.is_featured = entity.is_featured;
    if (entity.created_at !== undefined) record.created_at = entity.created_at;
    if (entity.updated_at !== undefined) record.updated_at = entity.updated_at;
    
    return record;
  }

  /**
   * Get featured hubs
   */
  async getFeatured(): Promise<RepositoryResponse<Hub[]>> {
    try {
      const result = await this.baseRepository.select()
        .eq('is_featured', true)
        .order('name', { ascending: true })
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
      
      return result as unknown as RepositoryResponse<Hub[]>;
    } catch (error) {
      this.handleError('getFeatured', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get featured hubs',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get featured hubs'
      };
    }
  }

  /**
   * Get hub by tag ID
   * @param tagId Tag ID to filter by
   */
  async getByTagId(tagId: string): Promise<RepositoryResponse<Hub | null>> {
    try {
      const result = await this.baseRepository.select()
        .eq('tag_id', tagId)
        .maybeSingle();
      
      if (result.isSuccess() && result.data) {
        return {
          data: this.convertToEntity(result.data),
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => null
        };
      }
      
      return result as unknown as RepositoryResponse<Hub | null>;
    } catch (error) {
      this.handleError('getByTagId', error, { tagId });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to get hub by tag ID: ${tagId}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to get hub by tag ID: ${tagId}`
      };
    }
  }
}
