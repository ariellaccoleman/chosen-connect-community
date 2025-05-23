
import { EntityRepository } from '../EntityRepository';
import { Hub, HubWithDetails } from '@/types/hub';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';
import { createSuccessResponse } from '../repositoryUtils';
import { logger } from '@/utils/logger';

/**
 * Repository for managing Hub entities
 */
export class HubRepository extends EntityRepository<Hub> {
  /**
   * Creates a new HubRepository
   * @param baseRepository The base repository to use for database operations
   */
  constructor(baseRepository: BaseRepository<Hub>) {
    super('hubs', EntityType.HUB, baseRepository);
  }

  /**
   * Convert database record to Hub entity
   */
  convertToEntity(record: any): Hub {
    // Convert timestamps to standard format
    const createdAt = record.created_at ? new Date(record.created_at).toISOString() : undefined;
    const updatedAt = record.updated_at ? new Date(record.updated_at).toISOString() : undefined;

    return {
      id: record.id,
      name: record.name,
      description: record.description || null,
      tag_id: record.tag_id || null,
      is_featured: record.is_featured || false,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  }

  /**
   * Convert Hub entity to database record
   */
  convertFromEntity(entity: Hub): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      tag_id: entity.tag_id,
      is_featured: entity.is_featured,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  /**
   * Convert database record to HubWithDetails entity
   */
  convertToDetailedEntity(record: any): HubWithDetails {
    const hub = this.convertToEntity(record);
    
    return {
      ...hub,
      tag: record.tag ? {
        id: record.tag.id,
        name: record.tag.name,
        description: record.tag.description || null
      } : undefined
    };
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
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<Hub[]>;
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
        return createSuccessResponse(this.convertToEntity(result.data));
      }
      
      return result as RepositoryResponse<Hub | null>;
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

  /**
   * Get hub with tag details
   * @param hubId Hub ID
   */
  async getWithTagDetails(hubId: string): Promise<RepositoryResponse<HubWithDetails | null>> {
    try {
      const result = await this.baseRepository.select('*, tag:tags(*)')
        .eq('id', hubId)
        .maybeSingle();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(this.convertToDetailedEntity(result.data));
      }
      
      return result as RepositoryResponse<HubWithDetails | null>;
    } catch (error) {
      this.handleError('getWithTagDetails', error, { hubId });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to get hub with tag details: ${hubId}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to get hub with tag details: ${hubId}`
      };
    }
  }

  /**
   * Get all hubs with tag details
   */
  async getAllWithTagDetails(): Promise<RepositoryResponse<HubWithDetails[]>> {
    try {
      const result = await this.baseRepository.select('*, tag:tags(*)')
        .order('name', { ascending: true })
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToDetailedEntity(record))
        );
      }
      
      return result as RepositoryResponse<HubWithDetails[]>;
    } catch (error) {
      this.handleError('getAllWithTagDetails', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get all hubs with tag details',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get all hubs with tag details'
      };
    }
  }
}

/**
 * Create a hub repository instance
 * @param baseRepository Base repository to use for database operations
 * @returns Hub repository instance
 */
export function createHubRepository(
  baseRepository: BaseRepository<Hub>
): HubRepository {
  try {
    return new HubRepository(baseRepository);
  } catch (error) {
    logger.error('Failed to create hub repository', error);
    throw error;
  }
}
