import { formatLocation, formatLocationWithDetails } from "./locationFormatters";
import { formatProfileUrls } from "./urlFormatters";

/**
 * Format a date string for database storage
 */
export const formatDateForDb = (dateStr: string): string => {
  if (!dateStr) return '';
  // If it's already ISO format, return as is
  if (dateStr.includes('Z') || dateStr.includes('+')) return dateStr;
  // Otherwise, convert to ISO format
  return new Date(dateStr).toISOString();
};

// Re-export all formatter modules correctly
export * from './locationFormatters';
export * from './profileFormatters';
export * from './organizationFormatters';
export * from './urlFormatters';
