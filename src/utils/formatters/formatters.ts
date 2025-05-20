
/**
 * Formats a date for database storage
 * @param date Date to format
 * @returns ISO string format
 */
export const formatDateForDb = (date: Date): string => {
  return date.toISOString();
};

/**
 * Collection of common formatters
 */
export const formatters = {
  date: {
    /**
     * Format date to YYYY-MM-DD
     */
    toYYYYMMDD: (date: Date): string => {
      return date.toISOString().split('T')[0];
    },
    
    /**
     * Format date to locale string
     */
    toLocale: (date: Date): string => {
      return date.toLocaleDateString();
    }
  }
};
