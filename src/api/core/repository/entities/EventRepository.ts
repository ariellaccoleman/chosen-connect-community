
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
   * Create a new EventRepository
   * 
   * @param tableName The table name
   * @param entityType The entity type
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<any>) {
    super(tableName, entityType, baseRepository);
  }

  /**
   * Convert database record to Event entity
   */
  convertToEntity(record: any): Event {
    return {
      id: record.id,
      entityType: EntityType.EVENT,
      name: record.title, // Map title to name for Entity interface
      title: record.title,
      description: record.description || '',
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
  }

  /**
   * Convert Event entity to database record
   */
  convertFromEntity(entity: Partial<Event>): Record<string, any> {
    const record: Record<string, any> = {};
    
    if (entity.id !== undefined) record.id = entity.id;
    if (entity.title !== undefined) record.title = entity.title;
    if (entity.description !== undefined) record.description = entity.description;
    if (entity.startTime !== undefined) record.start_time = entity.startTime;
    if (entity.endTime !== undefined) record.end_time = entity.endTime;
    if (entity.timezone !== undefined) record.timezone = entity.timezone;
    if (entity.locationId !== undefined) record.location_id = entity.locationId;
    if (entity.address !== undefined) record.address = entity.address;
    if (entity.isOnline !== undefined) record.is_virtual = entity.isOnline;
    if (entity.meetingLink !== undefined) record.meeting_link = entity.meetingLink;
    if (entity.creatorId !== undefined) record.host_id = entity.creatorId;
    if (entity.isPaid !== undefined) record.is_paid = entity.isPaid;
    if (entity.price !== undefined) record.price = entity.price;
    if (entity.currency !== undefined) record.currency = entity.currency;
    if (entity.capacity !== undefined) record.capacity = entity.capacity;
    
    return record;
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
      
      return result as unknown as RepositoryResponse<Event[]>;
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
      const nowIso = now.toISOString();
      
      // Use the baseRepository method correctly
      const result = await this.baseRepository.select()
        .filter('start_time', 'gte', nowIso)
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
      
      return result as unknown as RepositoryResponse<Event[]>;
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
