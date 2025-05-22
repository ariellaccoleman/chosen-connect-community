
import { EntityRepository } from '../EntityRepository';
import { Event } from '@/types/event';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';

/**
 * Repository for managing Event entities
 */
export class EventRepository extends EntityRepository<Event> {
  /**
   * Convert database record to Event entity
   */
  convertToEntity(record: any): Event {
    return {
      id: record.id,
      entityType: EntityType.EVENT,
      name: record.title,
      title: record.title,
      description: record.description || '',
      startTime: new Date(record.start_time),
      endTime: new Date(record.end_time),
      timezone: record.timezone || 'UTC',
      locationId: record.location_id,
      address: record.address || '',
      isOnline: record.is_online || false,
      meetingLink: record.meeting_link || '',
      creatorId: record.creator_id,
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
      is_online: entity.isOnline,
      meeting_link: entity.meetingLink,
      creator_id: entity.creatorId,
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
        .eq('creator_id', creatorId)
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
