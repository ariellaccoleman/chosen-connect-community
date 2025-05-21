
import { parseISO } from 'date-fns';
import { logger } from '@/utils/logger';

/**
 * Ensures a timestamp string is correctly formatted with UTC marker
 * 
 * @param timestamp ISO string that may or may not have a UTC 'Z' marker
 * @returns ISO string with UTC 'Z' marker
 */
export const ensureUTCTimestamp = (timestamp: string): string => {
  if (!timestamp) return timestamp;
  
  // Ensure the timestamp has a 'Z' UTC marker if missing
  return timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`;
};

/**
 * Parse a timestamp string to a Date object with proper UTC handling
 * 
 * @param timestamp ISO string timestamp
 * @returns Properly parsed Date object
 */
export const parseTimestampToDate = (timestamp: string | Date): Date => {
  if (!timestamp) {
    logger.warn('[TIME UTILS] Attempted to parse empty timestamp');
    return new Date();
  }
  
  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  try {
    // Ensure the timestamp has a UTC marker before parsing
    const timestampWithUTC = ensureUTCTimestamp(timestamp);
    
    // Parse the timestamp as UTC
    return parseISO(timestampWithUTC);
  } catch (error) {
    logger.error('[TIME UTILS] Error parsing timestamp:', error);
    return new Date();
  }
};

/**
 * Utility to get user's current timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Log timestamp information for debugging
 */
export const logTimestampDebugInfo = (
  messageId: string, 
  rawTimestamp: string, 
  formattedTimestamp: string
): void => {
  const userTimeZone = getUserTimezone();
  
  logger.info(
    `[TIMESTAMP] Message ${messageId}:\n` +
    `Raw: ${rawTimestamp}\n` + 
    `With UTC: ${ensureUTCTimestamp(rawTimestamp)}\n` +
    `User timezone: ${userTimeZone}\n` +
    `Formatted: ${formattedTimestamp}`
  );
};
