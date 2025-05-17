
/**
 * Events API module
 * 
 * IMPORTANT: Direct API usage is deprecated. 
 * Please use event hooks instead:
 * import { useEvents, useEventById, useEventMutations } from '@/hooks/events';
 */

// We're still re-exporting the API for internal use by hooks
export { eventsApi, extendedEventsApi } from './eventsApi';
