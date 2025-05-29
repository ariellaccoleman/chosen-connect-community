
import { Event } from "@/types/event";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { extendApiOperations } from "@/api/core/apiExtension";

/**
 * Factory for event API operations
 */
export const eventApi = createApiFactory<
  Event,
  string,
  Partial<Event>,
  Partial<Event>
>({
  tableName: 'events',
  entityName: 'Event',
  idField: 'id',
  defaultSelect: `
    *,
    location:locations(*),
    tag_assignments:tag_assignments(
      id,
      created_at,
      updated_at,
      tag:tags(*)
    )
  `,
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => {
    // Add tags from tag_assignments
    const event = { ...data };
    if (data.tag_assignments) {
      event.tags = data.tag_assignments;
    }
    return event;
  },
  transformRequest: (data) => {
    // Clean up data for insert/update
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects that should not be sent to the database
    delete cleanedData.location;
    delete cleanedData.tags;
    delete cleanedData.tag_assignments;
    
    // Ensure updated_at is set for updates
    if (!cleanedData.updated_at) {
      cleanedData.updated_at = new Date().toISOString();
    }
    
    return cleanedData;
  }
});

/**
 * Extended event API with additional operations
 */
export const extendedEventApi = extendApiOperations(eventApi, {
  createEventWithTags: async (eventData: Partial<Event>, hostId: string, tagIds: string[]) => {
    // First create the event
    const eventResult = await eventApi.create({ ...eventData, host_id: hostId } as any);
    
    if (eventResult.error || !eventResult.data) {
      return eventResult;
    }
    
    // TODO: Add tag assignment logic here if needed
    return eventResult;
  }
});

// Export specific operations for more granular imports
export const {
  getAll: getAllEvents,
  getById: getEventById,
  getByIds: getEventsByIds,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent
} = eventApi;
