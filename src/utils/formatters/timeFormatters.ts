
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { logger } from '@/utils/logger';

// Cache for parsed dates to avoid repeated expensive parsing
const parsedDateCache = new Map<string, Date>();

/**
 * Formats a timestamp into a human-readable relative time string
 * 
 * @param timestamp ISO string or Date object
 * @returns Formatted relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  if (!timestamp) return '';
  
  // Log the input timestamp for debugging
  logger.info(`[TIME FORMATTER] Input timestamp: ${timestamp}`);
  
  // Parse the ISO string to a Date object if it's a string, using cache for performance
  let date: Date;
  if (typeof timestamp === 'string') {
    // IMPORTANT FIX: Don't use cached dates as they might have incorrect timezone conversion
    // Parse directly from the ISO string, which correctly preserves the UTC time
    date = parseISO(timestamp);
    
    // Log the original date string and parsed date for debugging
    logger.info(`[TIME FORMATTER] Original ISO string: ${timestamp}`);
    logger.info(`[TIME FORMATTER] Parsed as UTC: ${date.toISOString()}`);
  } else {
    date = timestamp;
  }
  
  // Get the user's local timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Log raw details for debugging
  logger.info(`[TIME FORMATTER] Raw UTC date: ${date.toISOString()}`);
  logger.info(`[TIME FORMATTER] User timezone: ${userTimeZone}`);
  
  try {
    // Use formatDistanceToNow to get the relative time (e.g., "2 hours ago")
    const result = formatDistanceToNow(date, { addSuffix: true });
    logger.info(`[TIME FORMATTER] Formatted result: ${result}`);
    return result;
  } catch (error) {
    logger.error('[TIME FORMATTER] Error formatting time:', error);
    // Fallback to a simple formatted date if an error occurs
    return format(date, 'yyyy-MM-dd HH:mm');
  }
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
  
  // IMPORTANT FIX: Don't use cache, parse directly for correct timezone handling
  let date: Date;
  if (typeof timestamp === 'string') {
    date = parseISO(timestamp);
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
  logger.info('[TIME FORMATTER] Date cache cleared');
};

/**
 * Force clear the date cache and reload all chat messages
 * This function should be called when timezone issues are detected
 */
export const forceRefreshTimestamps = (): void => {
  clearDateCache();
  logger.info('[TIME FORMATTER] Timestamps refreshed, cache cleared');
  // The next time messages are displayed, they'll be parsed freshly
};
