
/**
 * Formats a date for database storage
 * @param date Date to format, can be a Date object or ISO string
 * @returns ISO string format
 */
export const formatDateForDb = (date: Date | string): string => {
  if (!date) return '';
  
  // If it's already a string, ensure it's properly formatted
  if (typeof date === 'string') {
    // Try to parse the string into a Date and then format it
    try {
      const dateObj = new Date(date);
      return dateObj.toISOString();
    } catch (error) {
      // If parsing fails, return the original string if it looks like an ISO string
      if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return date;
      }
      throw new Error(`Invalid date format: ${date}`);
    }
  }
  
  // Handle Date object
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
