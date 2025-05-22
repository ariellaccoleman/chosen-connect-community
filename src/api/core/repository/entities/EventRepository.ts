
import { EntityRepository } from '../EntityRepository';
import { Event } from '@/types/event';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';

/**
 * Repository for managing Event entities
 */
export class EventRepository extends EntityRepository<Event> {
  /**
   * The base repository to delegate database operations to
   */
  protected baseRepository: BaseRepository<Event>;
  
  /**
   * Create a new EventRepository
   * 
   * @param tableName The table name
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<Event>) {
    super(tableName, entityType);
    this.baseRepository = baseRepository;
  }

  /**
   * Delegate select operation to base repository
   */
  select(columns?: string): BaseRepository<Event> {
    return this.baseRepository.select(columns);
  }

  /**
   * Delegate insert operation to base repository
   */
  insert(values: Partial<Event> | Partial<Event>[]): BaseRepository<Event> {
    return this.baseRepository.insert(values);
  }

  /**
   * Delegate update operation to base repository
   */
  update(values: Partial<Event>): BaseRepository<Event> {
    return this.baseRepository.update(values);
  }

  /**
   * Delegate delete operation to base repository
   */
  delete(): BaseRepository<Event> {
    return this.baseRepository.delete();
  }

  /**
   * Convert database record to Event entity
   */
  convertToEntity(record: any): Event {
    const event = {
      ...record,
      entityType: EntityType.EVENT,
      name: record.title,
      // Map the database fields to the entity fields
      startTime: new Date(record.start_time),
      endTime: new Date(record.end_time),
      timezone: record.timezone || 'UTC',
      locationId: record.location_id,
      address: record.address || '',
      isOnline: record.is_virtual || false,
      meetingLink: record.meeting_link || '',
      creatorId: record.host_id,
      isPaid: record.is_paid || false,
      price: record.price || 0,
      currency: record.currency || 'USD',
      capacity: record.capacity,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
    return event as Event;
  }

  /**
   * Convert Event entity to database record
   */
  convertFromEntity(entity: Event): Record<string, any> {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      start_time: entity.startTime,
      end_time: entity.endTime,
      timezone: entity.timezone,
      location_id: entity.locationId,
      address: entity.address,
      is_virtual: entity.isOnline,
      meeting_link: entity.meetingLink,
      host_id: entity.creatorId,
      is_paid: entity.isPaid,
      price: entity.price,
      currency: entity.currency,
      capacity: entity.capacity,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Get events by creator
   * @param creatorId Creator ID to filter by
   */
  async getByCreator(creatorId: string): Promise<RepositoryResponse<Event[]>> {
    try {
      const result = await this.baseRepository.select()
        .eq('host_id', creatorId)
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
      
      return result as RepositoryResponse<Event[]>;
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
  async getUpcoming(): Promise<RepositoryResponse<Event[]>> {
    try {
      const now = new Date();
      const result = await this.baseRepository.select()
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true })
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
      
      return result as RepositoryResponse<Event[]>;
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
}
