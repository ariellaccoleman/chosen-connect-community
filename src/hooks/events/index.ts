
/**
 * Events hooks module - central location for all event-related hooks
 */

// Re-export the core event hooks
export * from './useEventHooks';

// Export additional specialized hooks
export * from './useEventTags';

// Legacy compatibility exports
export { useEvents, useEventById } from './useEventHooks';
