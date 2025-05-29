
import { Event } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { extendApiOperations } from "@/api/core/apiExtension";

/**
 * Create event API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
const createEventApi = (providedClient?: any) => {
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
};

// For backward compatibility - lazy-loaded instance
let _eventApiInstance: any = null;

/**
 * Lazy-loaded event API instance
 * Only created when first accessed to avoid early instantiation
 */
export const eventApi = new Proxy({} as any, {
  get(target, prop) {
    if (!_eventApiInstance) {
      _eventApiInstance = createEventApi();
    }
    return _eventApiInstance[prop];
  }
});

/**
 * Extended event API with additional operations for backward compatibility
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

// Export specific operations for more granular imports - these will also be lazy
export const getAllEvents = (...args: any[]) => eventApi.getAll(...args);
export const getEventById = (...args: any[]) => eventApi.getById(...args);
export const getEventsByIds = (...args: any[]) => eventApi.getByIds(...args);
export const createEvent = (...args: any[]) => eventApi.create(...args);
export const updateEvent = (...args: any[]) => eventApi.update(...args);
export const deleteEvent = (...args: any[]) => eventApi.delete(...args);
