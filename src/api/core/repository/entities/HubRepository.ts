
import { EntityRepository } from '../EntityRepository';
import { Hub } from '@/types/hub';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { RepositoryResponse } from '../DataRepository';
import { createSuccessResponse, createErrorResponse } from '../repositoryUtils';

/**
 * HubRepository class for specialized hub operations
 */
export class HubRepository extends EntityRepository<Hub> {
  constructor() {
    super('hubs', EntityType.HUB);
  }

  /**
   * Convert database record to Hub entity
   */
  convertToEntity(record: any): Hub {
    return {
      id: record.id,
      entityType: EntityType.HUB,
      name: record.name || '',
      description: record.description || '',
      tagId: record.tag_id || null,
      isFeatured: record.is_featured ?? false,
      createdAt: record.created_at ? new Date(record.created_at) : new Date(),
      updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
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
      tag_id: entity.tagId,
      is_featured: entity.isFeatured,
    };
  }

  /**
   * Find featured hubs
   */
  async findFeatured(): Promise<Hub[]> {
    try {
      const result = await this.select()
        .eq('is_featured', true)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findFeatured', error);
      return [];
    }
  }

  /**
   * Find hubs by tag
   */
  async findByTag(tagId: string): Promise<Hub[]> {
    try {
      const result = await this.select()
        .eq('tag_id', tagId)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findByTag', error, { tagId });
      return [];
    }
  }

  /**
   * Search hubs by name
   */
  async searchByName(query: string): Promise<Hub[]> {
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
}

