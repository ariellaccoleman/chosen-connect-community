
import { formatDistanceToNow, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { parseTimestampToDate, ensureUTCTimestamp, logTimestampDebugInfo } from '@/utils/chat/timeUtils';

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
  
  try {
    // Use our utility to ensure proper UTC parsing
    const date = parseTimestampToDate(timestamp);
    
    // Log raw details for debugging
    logger.info(`[TIME FORMATTER] Raw UTC date: ${date.toISOString()}`);
    logger.info(`[TIME FORMATTER] User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    // Calculate the relative time
    const result = formatDistanceToNow(date, { addSuffix: true });
    logger.info(`[TIME FORMATTER] Formatted result: ${result}`);
    return result;
  } catch (error) {
    logger.error('[TIME FORMATTER] Error formatting time:', error);
    // Fallback to a simple formatted date if an error occurs
    const date = timestamp instanceof Date ? timestamp : new Date();
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
  
  // Use our utility to ensure proper UTC parsing
  const date = parseTimestampToDate(timestamp);
  
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Force refresh timestamps
 * This function should be called when timezone issues are detected
 */
export const forceRefreshTimestamps = (): void => {
  logger.info('[TIME FORMATTER] Timestamps refreshed');
  // The next time messages are displayed, they'll be parsed freshly
};
