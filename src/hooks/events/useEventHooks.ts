
import { EventWithDetails, CreateEventInput } from "@/types/event";
import { eventsApi } from "@/api";
import { createQueryHooks } from "../core/factory/queryHookFactory";

/**
 * Generate standard event hooks using the query hook factory
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

// Export individual hooks for direct usage
export const {
  useList: useEvents,
  useById: useEventById,
  useCreate: useCreateEvent,
  useUpdate: useUpdateEvent,
  useDelete: useDeleteEvent
} = eventHooks;

// Re-export all hooks as a group
export const useEventHooks = eventHooks;
