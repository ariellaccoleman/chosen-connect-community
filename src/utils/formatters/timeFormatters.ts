
import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Formats a timestamp into a human-readable relative time string
 * that respects the user's local timezone
 * 
 * @param timestamp ISO string or Date object
 * @returns Formatted relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  if (!timestamp) return '';
  
  // Parse the ISO string to a Date object if it's a string
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  
  // Format the date as a relative time, making sure to use the local timezone
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Formats an ISO timestamp to a localized date string
 * 
 * @param timestamp ISO date string
 * @param options Intl.DateTimeFormatOptions to customize format
 * @returns Formatted date string in local timezone
 */
export const formatLocalDate = (
  timestamp: string | Date, 
  options: Intl.DateTimeFormatOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }
): string => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  
  return new Intl.DateTimeFormat(undefined, options).format(date);
};
