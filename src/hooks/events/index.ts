
/**
 * Events hooks module - central location for all event-related hooks
 */

// Re-export the core event hooks
export * from './useEventHooks';

// Export additional specialized hooks
export * from './useEventTags';

// Export event mutation hooks
export * from './useEventMutations';

// Export event registration hooks
export * from './useEventRegistration';

// Legacy compatibility exports
export { useEvents, useEventById } from './useEventHooks';
