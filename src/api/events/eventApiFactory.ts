

import { Event, EventWithDetails } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";

/**
 * Transform response data to EventWithDetails format
 */
const transformEventResponse = (data: any): EventWithDetails => {
  return {
    ...data,
    entityType: 'event',
    name: data.title || data.name, // Map title to name for Entity compatibility
    // Map tags from view format if available
    tags: data.tags || []
  } as EventWithDetails;
};

/**
 * Factory for event API operations
 */
export const eventApi = createApiFactory<
  EventWithDetails,
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
    host:profiles(*)
  `,
  withTagsView: 'events_with_tags', // Enable view-based operations
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: transformEventResponse,
  transformRequest: (data) => {
    // Clean up data for insert/update
    const cleanedData: Record<string, any> = { ...data };
    
    // Remove nested objects that should not be sent to the database
    delete cleanedData.location;
    delete cleanedData.host;
    delete cleanedData.tags;
    delete cleanedData.entityType;
    delete cleanedData.name; // Don't send name, use title
    
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
    EventWithDetails,
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
      host:profiles(*)
    `,
    withTagsView: 'events_with_tags',
    useMutationOperations: true,
    useBatchOperations: false,
    transformResponse: transformEventResponse,
    transformRequest: (data) => {
      // Clean up data for insert/update
      const cleanedData: Record<string, any> = { ...data };
      
      // Remove nested objects that should not be sent to the database
      delete cleanedData.location;
      delete cleanedData.host;
      delete cleanedData.tags;
      delete cleanedData.entityType;
      delete cleanedData.name;
      
      // Ensure updated_at is set for updates
      if (!cleanedData.updated_at) {
        cleanedData.updated_at = new Date().toISOString();
      }
      
      return cleanedData;
    }
  }, client);

  return {
    getAll: newApi.getAll,
    getById: newApi.getById,
    getByIds: newApi.getByIds,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete
  };
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

// Export extended API for backwards compatibility
export const extendedEventApi = eventApi;
