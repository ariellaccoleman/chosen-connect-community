
import { formatDistanceToNow, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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
  
  // Get the user's local timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Convert the UTC timestamp to the user's local time before calculating relative time
  const localDate = new Date(formatInTimeZone(date, userTimeZone, 'yyyy-MM-dd HH:mm:ss'));
  
  // Format the date as a relative time using the local date
  return formatDistanceToNow(localDate, { addSuffix: true });
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
