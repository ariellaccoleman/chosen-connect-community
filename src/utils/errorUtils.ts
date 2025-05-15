
import { logger } from './logger';
import { sonnerToast as toast } from '@/hooks/use-toast';

/**
 * Standard error handler that logs errors and optionally shows a toast notification
 */
export const handleError = (
  error: any, 
  context: string, 
  options: { 
    showToast?: boolean,
    customMessage?: string 
  } = { showToast: true }
) => {
  // Extract error message
  const errorMessage = error?.message || error?.error_description || 'An unknown error occurred';
  
  // Log the error
  logger.error(`${context}: ${errorMessage}`, error);
  
  // Show toast if enabled
  if (options.showToast) {
    toast.error(options.customMessage || `${context}: ${errorMessage}`);
  }
  
  return errorMessage;
};

/**
 * Format API error response for consistent display
 */
export const formatApiError = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.error_description) return error.error_description;
  
  return 'An unexpected error occurred';
};
