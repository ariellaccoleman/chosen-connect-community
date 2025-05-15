
import { createApiOperations } from '../core/apiFactory';
import { EventWithDetails, CreateEventInput } from '@/types/event';
import { formatDateForDb } from '@/utils/formatters';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { apiClient } from '@/api/core/apiClient';

// Define the raw event type from the database
type Event = Database['public']['Tables']['events']['Row'];

/**
 * Create API operations for events using the factory pattern
 */
export const eventsApi = createApiOperations<EventWithDetails, string, CreateEventInput, Partial<CreateEventInput>, 'events'>(
  'event',
  'events',
  {
    defaultOrderBy: 'start_time',
    defaultSelect: '*, location:locations(*), host:profiles(*)',
    
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
      
      // Format dates for the database
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
      
      return transformed;
    }
  }
);

// Export individual operations for direct usage
export const {
  getAll,
  getById,
  getByIds,
  create,
  update,
  delete: deleteEvent
} = eventsApi;

// Additional event-specific API functions that extend the standard CRUD operations
export const extendedEventsApi = {
  ...eventsApi,
  
  /**
   * Create an event with tags in a single operation
   */
  async createEventWithTags(eventData: CreateEventInput, hostId: string, tagIds: string[] = []) {
    logger.info('Creating event with tags', { eventData, hostId, tagIds });
    
    // First create the event
    const eventResult = await eventsApi.create({
      ...eventData,
      host_id: hostId
    } as any); // Using 'as any' because we're adding host_id which isn't in CreateEventInput
    
    if (eventResult.error || !eventResult.data) {
      logger.error('Error creating event', eventResult.error);
      return eventResult;
    }
    
    // If we have tags, create assignments
    if (tagIds.length > 0 && eventResult.data.id) {
      const { data, error } = await apiClient.query(async (client) => {
        // Create tag assignments
        const assignments = tagIds.map(tagId => ({
          target_id: eventResult.data.id,
          target_type: 'event',
          tag_id: tagId
        }));
        
        return client.from('tag_assignments').insert(assignments);
      });
      
      if (error) {
        logger.warn('Error assigning tags to event', { error, eventId: eventResult.data.id });
        // We still return the event even if tag assignment fails
      }
    }
    
    return eventResult;
  }
};
