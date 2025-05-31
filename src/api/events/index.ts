
/**
 * Events API module
 * 
 * IMPORTANT: Direct API usage is deprecated. 
 * Please use event hooks instead:
 * import { useEvents, useEventById, useEventMutations } from '@/hooks/events';
 */

// Export the API factory for internal use by hooks
export * from './eventApiFactory';
export { eventApi, eventViewApi, eventCompositeApi } from './eventApiFactory';
