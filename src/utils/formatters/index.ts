import { locationFormatters } from "./locationFormatters";
import { profileFormatters } from "./profileFormatters";
import { organizationFormatters } from "./organizationFormatters";
import { urlFormatters } from "./urlFormatters";

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

export {
  locationFormatters,
  profileFormatters,
  organizationFormatters,
  urlFormatters
};
