
import { EntityRepository } from '../EntityRepository';
import { Event, EventWithDetails } from '@/types/event';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';
import { createSuccessResponse } from '../repositoryUtils';
import { logger } from '@/utils/logger';

/**
 * Repository for managing Event entities
 */
export class EventRepository extends EntityRepository<EventWithDetails> {
  /**
   * Creates a new EventRepository
   * @param baseRepository The base repository to use for database operations
   */
  constructor(baseRepository: BaseRepository<EventWithDetails>) {
    super('events', EntityType.EVENT, baseRepository);
  }

  /**
   * Convert database record to Event entity
   */
  convertToEntity(record: any): EventWithDetails {
    // Convert timestamps to standard format
    const createdAt = record.created_at ? new Date(record.created_at).toISOString() : undefined;
    const updatedAt = record.updated_at ? new Date(record.updated_at).toISOString() : undefined;
    const startTime = record.start_time ? new Date(record.start_time).toISOString() : undefined;
    const endTime = record.end_time ? new Date(record.end_time).toISOString() : undefined;

    return {
      id: record.id,
      title: record.title || '',
      description: record.description || '',
      start_time: startTime,
      end_time: endTime,
      is_virtual: record.is_virtual || false,
      location_id: record.location_id,
      is_paid: record.is_paid || false,
      price: record.price || null,
      host_id: record.host_id,
      tag_id: record.tag_id || null, // Added this line to include tag_id
      created_at: createdAt,
      updated_at: updatedAt,
      
      // Include location if available
      location: record.location,
      
      // Include host if available
      host: record.host,
      
      // Include tags if available
      tags: record.tags || [],
      
      // Add Entity required fields
      entityType: EntityType.EVENT,
      name: record.title || '', // Map title to name for Entity compatibility
    };
  }

  /**
   * Convert Event entity to database record
   */
  convertFromEntity(entity: EventWithDetails): Record<string, any> {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      start_time: entity.start_time,
      end_time: entity.end_time,
      is_virtual: entity.is_virtual,
      location_id: entity.location_id,
      is_paid: entity.is_paid,
      price: entity.price,
      host_id: entity.host_id,
      tag_id: entity.tag_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  /**
   * Get events by creator
   * @param creatorId Creator ID to filter by
   */
  async getByCreator(creatorId: string): Promise<RepositoryResponse<EventWithDetails[]>> {
    try {
      const result = await this.baseRepository.select()
        .eq('host_id', creatorId)
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<EventWithDetails[]>;
    } catch (error) {
      this.handleError('getByCreator', error, { creatorId });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to get events by creator ID: ${creatorId}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to get events by creator ID: ${creatorId}`
      };
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcoming(): Promise<RepositoryResponse<EventWithDetails[]>> {
    try {
      const now = new Date();
      const result = await this.baseRepository.select()
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true })
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<EventWithDetails[]>;
    } catch (error) {
      this.handleError('getUpcoming', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get upcoming events',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get upcoming events'
      };
    }
  }

  /**
   * Get past events
   */
  async getPastEvents(): Promise<RepositoryResponse<EventWithDetails[]>> {
    try {
      const now = new Date();
      const result = await this.baseRepository.select()
        .lt('end_time', now.toISOString())
        .order('start_time', { ascending: false })
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<EventWithDetails[]>;
    } catch (error) {
      this.handleError('getPastEvents', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get past events',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get past events'
      };
    }
  }
}

/**
 * Create an event repository instance
 * @param baseRepository Base repository to use for database operations
 * @returns Event repository instance
 */
export function createEventRepository(
  baseRepository: BaseRepository<EventWithDetails>
): EventRepository {
  try {
    return new EventRepository(baseRepository);
  } catch (error) {
    logger.error('Failed to create event repository', error);
    throw error;
  }
}
