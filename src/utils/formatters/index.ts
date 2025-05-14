
import * as locationFormatters from './locationFormatters';
import * as organizationFormatters from './organizationFormatters';
import * as profileFormatters from './profileFormatters';
import * as urlFormatters from './urlFormatters';

// Format dates for database storage
export function formatDateForDb(dateString: string): string {
  // Ensure date is in ISO format and properly formatted for DB
  const date = new Date(dateString);
  return date.toISOString();
}

// Export all formatters as a single object
export const formatters = {
  ...locationFormatters,
  ...organizationFormatters,
  ...profileFormatters,
  ...urlFormatters,
  formatDateForDb,
};

// Re-export all formatters
export * from './locationFormatters';
export * from './organizationFormatters';
export * from './profileFormatters';
export * from './urlFormatters';
// Don't re-export formatDateForDb as it's already exported above
