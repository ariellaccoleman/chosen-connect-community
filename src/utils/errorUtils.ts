
import { logger } from './logger';
import { sonnerToast as toast } from '@/hooks/use-toast';
import { RepositoryError } from '@/api/core/repository/DataRepository';

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
  // Extract error message using the enhanced approach
  const errorMessage = extractErrorMessage(error);
  
  // Log the error
  logger.error(`${context}: ${errorMessage}`, error);
  
  // Show toast if enabled
  if (options.showToast) {
    toast.error(options.customMessage || `${context}: ${errorMessage}`);
  }
  
  return errorMessage;
};

/**
 * Extract error message from different error types
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Handle repository errors
  if (error.code && error.message) {
    return error.message;
  }
  
  // Handle standard Error objects
  if (error.message) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle nested error objects
  if (error.error?.message) {
    return error.error.message;
  }
  
  if (error.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Format API error response for consistent display
 */
export const formatApiError = (error: any): string => {
  return extractErrorMessage(error);
};

/**
 * Check if response is a repository error
 */
export const isRepositoryError = (response: any): boolean => {
  return response && response.error !== null && response.status === 'error';
};

/**
 * Format Repository error for display or logging
 */
export const formatRepositoryError = (error: RepositoryError | null): string => {
  if (!error) return 'Unknown error';
  return `${error.code}: ${error.message}`;
};
