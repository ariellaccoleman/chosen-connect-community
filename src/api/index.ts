
/**
 * Re-export all API functionality
 */
export * from './authApi';
export * from './core';

// Export events API with explicit naming to avoid conflicts
export { 
  eventApi,
  extendedEventApi,
  getAllEvents,
  getEventById,
  getEventsByIds,
  createEvent,
  updateEvent,
  deleteEvent,
  resetEventApi
} from './events/eventApiFactory';

export * from './locations';
export { locationsApi } from './locationsApi';

// Export organizations API with explicit naming
export { 
  organizationApi,
  getAllOrganizations,
  getOrganizationById,
  getOrganizationsByIds,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  resetOrganizationApi
} from './organizations/organizationApiFactory';

export * from './tags';

// Export chat API with explicit naming
export { 
  chatChannelsApi,
  chatMessageApi,
  resetChatChannelsApi,
  resetChatMessageApi
} from './chat';

export * from './tests';
export * from './posts';
