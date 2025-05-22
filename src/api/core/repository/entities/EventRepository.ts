
import { EntityRepository } from '../EntityRepository';
import { Event } from '@/types/event';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { RepositoryResponse } from '../DataRepository';
import { createSuccessResponse, createErrorResponse } from '../repositoryUtils';

/**
 * EventRepository class for specialized event operations
 */
export class EventRepository extends EntityRepository<Event> {
  constructor() {
    super('events', EntityType.EVENT);
  }

  /**
   * Convert database record to Event entity
   */
  convertToEntity(record: any): Event {
    return {
      id: record.id,
      entityType: EntityType.EVENT,
      title: record.title || '',
      description: record.description || '',
      startTime: record.start_time ? new Date(record.start_time) : null,
      endTime: record.end_time ? new Date(record.end_time) : null,
      isVirtual: record.is_virtual ?? false,
      isPaid: record.is_paid ?? false,
      price: record.price || null,
      hostId: record.host_id || null,
      locationId: record.location_id || null,
      tagId: record.tag_id || null,
      name: record.title || '', // For compatibility with Entity interface
      createdAt: record.created_at ? new Date(record.created_at) : new Date(),
      updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
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
      is_virtual: entity.isVirtual,
      is_paid: entity.isPaid,
      price: entity.price,
      host_id: entity.hostId,
      location_id: entity.locationId,
      tag_id: entity.tagId,
    };
  }

  /**
   * Find upcoming events
   */
  async findUpcoming(): Promise<Event[]> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.select()
        .is('start_time', false) // Not NULL
        .execute();

      if (result.isSuccess() && result.data) {
        // Filter events where start_time is in the future
        const events = result.data
          .filter(record => record.start_time && new Date(record.start_time) > new Date())
          .map(record => this.convertToEntity(record));
          
        // Sort by start time
        return events.sort((a, b) => {
          if (!a.startTime || !b.startTime) return 0;
          return a.startTime.getTime() - b.startTime.getTime();
        });
      }

      return [];
    } catch (error) {
      this.handleError('findUpcoming', error);
      return [];
    }
  }

  /**
   * Find events by host
   */
  async findByHost(hostId: string): Promise<Event[]> {
    try {
      const result = await this.select()
        .eq('host_id', hostId)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findByHost', error, { hostId });
      return [];
    }
  }

  /**
   * Find events by location
   */
  async findByLocation(locationId: string): Promise<Event[]> {
    try {
      const result = await this.select()
        .eq('location_id', locationId)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findByLocation', error, { locationId });
      return [];
    }
  }
}

