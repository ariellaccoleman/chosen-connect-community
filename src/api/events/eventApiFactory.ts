import { Event } from "@/types";
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
});

/**
 * Reset event API with authenticated client
 */
export const resetEventApi = (client?: any) => {
  const newApi = createApiFactory<
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
  }, client);

  const newExtendedApi = extendApiOperations(newApi, {
    createEventWithTags: async (eventData: Partial<Event>, hostId: string, tagIds: string[]) => {
      // First create the event
      const eventResult = await newApi.create({ ...eventData, host_id: hostId } as any);
      
      if (eventResult.error || !eventResult.data) {
        return eventResult;
      }
      
      // TODO: Add tag assignment logic here if needed
      return eventResult;
    }
  });

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete,
    createEventWithTags: newExtendedApi.createEventWithTags
  };
};

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

// Export specific operations for more granular imports
export const {
  getAll: getAllEvents,
  getById: getEventById,
  getByIds: getEventsByIds,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent
} = eventApi;
