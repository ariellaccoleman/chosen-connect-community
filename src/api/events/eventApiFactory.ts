
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
    
    // Transform snake_case to camelCase
    const event: EventWithDetails = {
      id: data.id,
      entityType: EntityType.EVENT,
      name: data.title,
      title: data.title,
      description: data.description || '',
      startTime: new Date(data.start_time),
      endTime: new Date(data.end_time),
      timezone: data.timezone || 'UTC',
      locationId: data.location_id,
      address: data.address || '',
      isOnline: data.is_virtual || false,
      meetingLink: data.meeting_link || '',
      creatorId: data.host_id,
      isPaid: data.is_paid || false,
      price: data.price || 0,
      currency: data.currency || 'USD',
      capacity: data.capacity,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      location: data.location,
      host: data.host ? {
        id: data.host.id,
        entityType: EntityType.PERSON,
        name: `${data.host.first_name} ${data.host.last_name}`,
        firstName: data.host.first_name,
        lastName: data.host.last_name,
        email: data.host.email,
        bio: data.host.bio || '',
        headline: data.host.headline || '',
        avatarUrl: data.host.avatar_url || '',
        company: data.host.company || '',
        websiteUrl: data.host.website_url || '',
        twitterUrl: data.host.twitter_url || '',
        linkedinUrl: data.host.linkedin_url || '',
        timezone: data.host.timezone || 'UTC',
        isApproved: data.host.is_approved || false,
        createdAt: new Date(data.host.created_at),
        updatedAt: new Date(data.host.updated_at),
      } : null,
      tags: data.tags || []
    };
    
    return event;
  },
  
  transformRequest: (data) => {
    logger.debug('Transforming event request', data);
    
    const transformed: Record<string, any> = {};
    
    if (data.title !== undefined) transformed.title = data.title;
    if (data.description !== undefined) transformed.description = data.description;
    
    // Format dates for the database - ensure we handle string dates correctly
    if (data.startTime !== undefined) {
      transformed.start_time = formatDateForDb(data.startTime);
    }
    if (data.endTime !== undefined) {
      transformed.end_time = formatDateForDb(data.endTime);
    }
    
    // Handle location based on virtual status
    if (data.isOnline !== undefined) {
      transformed.is_virtual = data.isOnline;
      if (data.isOnline) {
        transformed.location_id = null;
      } else if (data.locationId !== undefined) {
        transformed.location_id = data.locationId;
      }
    } else if (data.locationId !== undefined) {
      transformed.location_id = data.locationId;
    }
    
    // Handle price based on paid status
    if (data.isPaid !== undefined) {
      transformed.is_paid = data.isPaid;
      if (data.isPaid && data.price !== undefined) {
        transformed.price = data.price;
      } else if (!data.isPaid) {
        transformed.price = null;
      }
    } else if (data.price !== undefined) {
      transformed.price = data.price;
    }
    
    // Handle host_id assignment
    if (data.hostId !== undefined) {
      transformed.host_id = data.hostId;
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
      hostId
    } as any);
    
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

// Export specific operations for more granular imports
export const {
  getAll: getAllEvents,
  getById: getEventById,
  getByIds: getEventsByIds,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent
} = eventApi;

// Import for type reference
import { EntityType } from '@/types/entityTypes';
