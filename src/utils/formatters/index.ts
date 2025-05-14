
// Import formatters from modules
export * from './locationFormatters';
export * from './profileFormatters';
export * from './organizationFormatters';
export * from './urlFormatters';

// Format date for database
export const formatDateForDb = (dateString: string): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};
