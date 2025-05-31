
import { Event, EventWithDetails } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { createViewApiFactory } from "@/api/core/factory/viewApiFactory";

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
 * Standard event API for CRUD operations on the events table
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
  defaultSelect: `*, location:locations(*), host:profiles(*)`,
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
 * Event view API for read-only operations with tag filtering and search
 */
export const eventViewApi = createViewApiFactory<EventWithDetails>({
  viewName: 'events_with_tags',
  entityName: 'Event',
  defaultSelect: '*',
  transformResponse: transformEventResponse
});

/**
 * Composite event API that combines CRUD and view operations
 */
export const eventCompositeApi = {
  // CRUD operations from table API
  ...eventApi,
  
  // View operations for enhanced querying
  search: eventViewApi.search,
  filterByTagIds: eventViewApi.filterByTagIds,
  filterByTagNames: eventViewApi.filterByTagNames
};

/**
 * Reset event API with authenticated client
 */
export const resetEventApi = (client?: any) => {
  const newTableApi = createApiFactory<
    EventWithDetails,
    string,
    Partial<Event>,
    Partial<Event>
  >({
    tableName: 'events',
    entityName: 'Event',
    idField: 'id',
    defaultSelect: `*, location:locations(*), host:profiles(*)`,
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

  const newViewApi = createViewApiFactory<EventWithDetails>({
    viewName: 'events_with_tags',
    entityName: 'Event',
    defaultSelect: '*',
    transformResponse: transformEventResponse
  }, client);

  return {
    // CRUD operations
    ...newTableApi,
    
    // View operations
    search: newViewApi.search,
    filterByTagIds: newViewApi.filterByTagIds,
    filterByTagNames: newViewApi.filterByTagNames
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
export const extendedEventApi = eventCompositeApi;
