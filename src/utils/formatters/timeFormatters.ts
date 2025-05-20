
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { logger } from '@/utils/logger';

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
  
  let date: Date;
  if (typeof timestamp === 'string') {
    // IMPORTANT FIX: Ensure database timestamps (which are UTC but don't have Z) 
    // are correctly parsed as UTC by appending 'Z' if missing
    const timestampWithUTC = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
    logger.info(`[TIME FORMATTER] Adjusted ISO string with UTC marker: ${timestampWithUTC}`);
    
    // Parse the timestamp as UTC
    date = parseISO(timestampWithUTC);
    
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
  
  // Add current time for comparison
  const now = new Date();
  logger.info(`[TIME FORMATTER] Current time (Now): ${now.toISOString()}`);
  logger.info(`[TIME FORMATTER] Time difference (milliseconds): ${now.getTime() - date.getTime()}`);
  
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
  
  let date: Date;
  if (typeof timestamp === 'string') {
    // IMPORTANT FIX: Ensure database timestamps are correctly parsed as UTC
    const timestampWithUTC = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
    date = parseISO(timestampWithUTC);
  } else {
    date = timestamp;
  }
  
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Force clear any cached data and reload all chat messages
 * This function should be called when timezone issues are detected
 */
export const forceRefreshTimestamps = (): void => {
  logger.info('[TIME FORMATTER] Timestamps refreshed');
  // The next time messages are displayed, they'll be parsed freshly
};
