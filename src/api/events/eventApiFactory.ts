
import { Event } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { extendApiOperations } from "@/api/core/apiExtension";

/**
 * Cached event API instances
 */
let cachedEventApi: any = null;
let cachedExtendedEventApi: any = null;

/**
 * Factory for event API operations  
 */
function createEventApiInstance(providedClient?: any) {
  return createApiFactory<
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
      tag:tags(*)
    `,
    useMutationOperations: true,
    useBatchOperations: false,
    transformResponse: (data) => {
      return {
        ...data,
        // Ensure proper formatting of related data
        location: data.location || null,
        tag: data.tag || null
      };
    },
    transformRequest: (data) => {
      // Clean up data for insert/update
      const cleanedData: Record<string, any> = { ...data };
      
      // Remove nested objects that should not be sent to the database
      delete cleanedData.location;
      delete cleanedData.tag;
      
      // Ensure updated_at is set for updates
      if (!cleanedData.updated_at) {
        cleanedData.updated_at = new Date().toISOString();
      }
      
      return cleanedData;
    }
  }, providedClient);
}

// Initialize with default client
if (!cachedEventApi) {
  cachedEventApi = createEventApiInstance();
}

export const eventApi = cachedEventApi;

/**
 * Extended event API with additional operations for backward compatibility
 */
function createExtendedEventApiInstance(baseEventApi: any) {
  return extendApiOperations(baseEventApi, {
    createEventWithTags: async (eventData: Partial<Event>, hostId: string, tagIds: string[]) => {
      // First create the event
      const eventResult = await baseEventApi.create({ ...eventData, host_id: hostId } as any);
      
      if (eventResult.error || !eventResult.data) {
        return eventResult;
      }
      
      // TODO: Add tag assignment logic here if needed
      return eventResult;
    }
  });
}

if (!cachedExtendedEventApi) {
  cachedExtendedEventApi = createExtendedEventApiInstance(cachedEventApi);
}

export const extendedEventApi = cachedExtendedEventApi;

/**
 * Reset event APIs with authenticated client
 */
export function resetEventApi(authenticatedClient: any) {
  cachedEventApi = createEventApiInstance(authenticatedClient);
  cachedExtendedEventApi = createExtendedEventApiInstance(cachedEventApi);
  return { eventApi: cachedEventApi, extendedEventApi: cachedExtendedEventApi };
}

// Export specific operations for more granular imports
export const {
  getAll: getAllEvents,
  getById: getEventById,
  getByIds: getEventsByIds,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent
} = cachedEventApi;
