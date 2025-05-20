
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
  
  // Convert the UTC timestamp to the user's local timezone
  const localDate = toZonedTime(date, userTimeZone);
  
  // Calculate seconds difference to detect if we're dealing with a server-client time discrepancy
  const now = new Date();
  const secDiff = differenceInSeconds(now, localDate);
  
  // If the difference is suspiciously close to exact hours (within 30 sec),
  // it might be a timezone issue where the server time is UTC but displayed as local
  if (Math.abs(secDiff % 3600) < 30 && Math.abs(secDiff) >= 3600 && Math.abs(secDiff) <= 86400) {
    // Use current time as base for relative calculation instead of the potentially mismatched timestamp
    return formatDistanceToNow(now, { addSuffix: true });
  }
  
  // Standard case - format the local date as a relative time
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
