
import { createQueryHooks } from '../core/queryHookFactory';
import { eventsApi } from '@/api/events';
import { EventWithDetails, CreateEventInput } from '@/types/event';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Create standard query hooks for events using the factory pattern
 */
export const eventHooks = createQueryHooks<
  EventWithDetails, 
  string,
  CreateEventInput,
  Partial<CreateEventInput>
>(
  {
    name: 'event',
    pluralName: 'events',
    displayName: 'Event',
    pluralDisplayName: 'Events'
  },
  eventsApi
);

// Extract individual hooks for direct usage
export const {
  useList: useEventsList,
  useById: useEventById,
  useCreate: useCreateEvent,
  useUpdate: useUpdateEvent,
  useDelete: useDeleteEvent
} = eventHooks;

/**
 * Hook for creating an event with user ID and optional tags
 */
export function useCreateEventWithHost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      event, 
      hostId, 
      tagIds = [] 
    }: { 
      event: CreateEventInput; 
      hostId: string; 
      tagIds?: string[] 
    }) => {
      logger.info('Creating event with host', { event, hostId, tagIds });
      
      // Use the standard create operation but add host_id
      const response = await eventsApi.create({
        ...event,
        host_id: hostId
      } as any); // Using 'as any' because host_id isn't in CreateEventInput
      
      if (response.error) {
        logger.error('Error creating event', response.error);
        throw new Error(response.error.message || 'Failed to create event');
      }
      
      // If we have tags and the event was created successfully, assign them
      if (tagIds.length > 0 && response.data) {
        try {
          await assignTagsToEvent(response.data.id, tagIds);
        } catch (error) {
          logger.warn('Error assigning tags to event, but event was created', { 
            error, 
            eventId: response.data.id 
          });
          // We don't throw here as the event was still created successfully
        }
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      logger.info('Event created successfully', data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error) => {
      logger.error('Event creation failed', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    }
  });
}

/**
 * Helper function to assign tags to an event
 */
async function assignTagsToEvent(eventId: string, tagIds: string[]) {
  if (!tagIds.length) return;
  
  const { apiClient } = await import('@/api/core/apiClient');
  
  return apiClient.query(async (client) => {
    const assignments = tagIds.map(tagId => ({
      target_id: eventId,
      target_type: 'event',
      tag_id: tagId
    }));
    
    return client.from('tag_assignments').insert(assignments);
  });
}
