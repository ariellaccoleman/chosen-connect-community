
/**
 * @deprecated Use the event hooks from '@/hooks/events' instead
 * This file is maintained for backward compatibility only.
 */

import { eventApi, extendedEventApi } from './eventApiFactory';

// Re-export for backward compatibility
export const eventsApi = eventApi;
export const extendedEventsApi = extendedEventApi;
