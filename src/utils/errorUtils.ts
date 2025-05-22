import { logger } from './logger';
import { toast } from '@/hooks/use-toast';
import { RepositoryError } from '@/api/core/repository/DataRepository';
import { formatRepositoryError } from '@/api/core/repository/repositoryUtils';
import { ApiError } from '@/api/core/errorHandler';

/**
 * Standard error handler that logs errors and optionally shows a toast notification
 */
export const handleError = (
  error: unknown, 
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
 * This handles various error formats from different parts of the application
 */
export const extractErrorMessage = (error: unknown): string => {
  if (!error) return 'Unknown error occurred';
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle ApiError type
  if (typeof error === 'object' && error !== null) {
    // Check for ApiError structure
    if ('code' in error && 'message' in error && typeof (error as ApiError).message === 'string') {
      return (error as ApiError).message;
    }
    
    // Check for error property (nested error objects)
    if ('error' in error && error.error && typeof error.error === 'object') {
      if ('message' in error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }
    }
    
    // Check for message property
    if ('message' in error && typeof (error as { message: string }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  
  // Use repository error formatter as fallback for other error types
  const repoError = formatRepositoryError(error);
  if (repoError.message) {
    return repoError.message;
  }
  
  // Last resort: try to stringify the error
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
};

/**
 * Format API error response for consistent display
 */
export const formatApiError = (error: unknown): string => {
  return extractErrorMessage(error);
};

/**
 * Check if response is a repository error
 */
export const isRepositoryError = (response: unknown): boolean => {
  return !!response && 
         typeof response === 'object' && 
         'error' in response && 
         'status' in response && 
         (response as any).status === 'error';
};

/**
 * Create a standardized error object from any error type
 */
export const createErrorObject = (error: unknown): { 
  message: string; 
  code?: string; 
  details?: unknown;
  original?: unknown;
} => {
  if (!error) {
    return { message: 'Unknown error occurred' };
  }
  
  // If it's already a repository error, return it directly
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    return {
      message: (error as { message: string }).message,
      code: (error as { code: string }).code,
      details: (error as { details?: unknown }).details,
      original: error
    };
  }
  
  // For standard errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
      original: error
    };
  }
  
  // For string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'string_error'
    };
  }
  
  // For everything else
  return {
    message: extractErrorMessage(error),
    code: 'unknown_error',
    original: error
  };
};
