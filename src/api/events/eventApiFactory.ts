
import { EventWithDetails, CreateEventInput } from '@/types';
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { formatDateForDb } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import { apiClient } from '@/api/core/apiClient';

/**
 * Factory for event API operations using the standardized factory pattern
 */
export const eventApi = createApiFactory<
  EventWithDetails,
  string,
  CreateEventInput,
  Partial<CreateEventInput>
>({
  tableName: 'events',
  entityName: 'Event',
  idField: 'id',
  defaultSelect: '*, location:locations(*), host:profiles(*)',
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false,
  
  transformResponse: (data) => {
    logger.debug('Transforming event response', data);
    
    // The response already includes location and host from the join
    return {
      ...data,
      // Set default values for nullable fields
      is_virtual: data.is_virtual || false,
      is_paid: data.is_paid || false,
      tags: data.tags || []
    } as EventWithDetails;
  },
  
  transformRequest: (data) => {
    logger.debug('Transforming event request', data);
    
    const transformed: Record<string, any> = {};
    
    if (data.title !== undefined) transformed.title = data.title;
    if (data.description !== undefined) transformed.description = data.description;
    
    // Format dates for the database - ensure we handle string dates correctly
    if (data.start_time !== undefined) {
      transformed.start_time = formatDateForDb(data.start_time);
    }
    if (data.end_time !== undefined) {
      transformed.end_time = formatDateForDb(data.end_time);
    }
    
    // Handle location based on virtual status
    if (data.is_virtual !== undefined) {
      transformed.is_virtual = data.is_virtual;
      if (data.is_virtual) {
        transformed.location_id = null;
      } else if (data.location_id !== undefined) {
        transformed.location_id = data.location_id;
      }
    } else if (data.location_id !== undefined) {
      transformed.location_id = data.location_id;
    }
    
    // Handle price based on paid status
    if (data.is_paid !== undefined) {
      transformed.is_paid = data.is_paid;
      if (data.is_paid && data.price !== undefined) {
        transformed.price = data.price;
      } else if (!data.is_paid) {
        transformed.price = null;
      }
    } else if (data.price !== undefined) {
      transformed.price = data.price;
    }
    
    // Handle host_id assignment
    if (data.host_id !== undefined) {
      transformed.host_id = data.host_id;
    }
    
    return transformed;
  }
});

/**
 * Additional event-specific API functions that extend the standard operations
 */
export const extendedEventApi = {
  ...eventApi,
  
  /**
   * Create an event with tags in a single operation
   */
  async createEventWithTags(eventData: CreateEventInput, hostId: string, tagIds: string[] = []) {
    logger.info('Creating event with tags', { eventData, hostId, tagIds });
    
    // First create the event
    const eventResult = await eventApi.create({
      ...eventData,
      host_id: hostId
    } as any);
    
    if (eventResult.error || !eventResult.data) {
      logger.error('Error creating event', eventResult.error);
      return eventResult;
    }
    
    // If we have tags, create assignments
    if (tagIds.length > 0 && eventResult.data.id) {
      const { data, error } = await apiClient.query(async (client) => {
        // Create tag assignments with proper type casting
        const assignments = tagIds.map(tagId => ({
          target_id: eventResult.data.id,
          target_type: 'event' as const,
          tag_id: tagId
        }));
        
        // Type cast the assignments to bypass strict typing
        return client.from('tag_assignments').insert(assignments as any);
      });
      
      if (error) {
        logger.warn('Error assigning tags to event', { error, eventId: eventResult.data.id });
        // We still return the event even if tag assignment fails
      }
    }
    
    return eventResult;
  }
};

// Export specific operations for more granular imports
export const {
  getAll: getAllEvents,
  getById: getEventById,
  getByIds: getEventsByIds,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent
} = eventApi;
