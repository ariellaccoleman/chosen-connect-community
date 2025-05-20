
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Cache for parsed dates to avoid repeated expensive parsing
const parsedDateCache = new Map<string, Date>();

/**
 * Formats a timestamp into a human-readable relative time string
 * that respects the user's local timezone
 * 
 * @param timestamp ISO string or Date object
 * @returns Formatted relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  if (!timestamp) return '';
  
  // Parse the ISO string to a Date object if it's a string, using cache for performance
  let date: Date;
  if (typeof timestamp === 'string') {
    if (parsedDateCache.has(timestamp)) {
      date = parsedDateCache.get(timestamp)!;
    } else {
      date = parseISO(timestamp);
      // Store in cache for future reuse
      parsedDateCache.set(timestamp, date);
      
      // Prevent cache from growing too large (simple LRU-like behavior)
      if (parsedDateCache.size > 1000) {
        // Remove oldest entry
        const firstKey = parsedDateCache.keys().next().value;
        parsedDateCache.delete(firstKey);
      }
    }
  } else {
    date = timestamp;
  }
  
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
  
  // Use cache for parsing dates when it's a string
  let date: Date;
  if (typeof timestamp === 'string') {
    if (parsedDateCache.has(timestamp)) {
      date = parsedDateCache.get(timestamp)!;
    } else {
      date = parseISO(timestamp);
      parsedDateCache.set(timestamp, date);
    }
  } else {
    date = timestamp;
  }
  
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Clear the date cache if needed (useful for testing or when memory concerns arise)
 */
export const clearDateCache = (): void => {
  parsedDateCache.clear();
};
