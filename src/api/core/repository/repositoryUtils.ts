
/**
 * Utility functions for repositories
 */

import { RepositoryResponse, RepositoryError } from './DataRepository';
import { logger } from '@/utils/logger';

/**
 * Create a success response for repository operations
 */
export function createSuccessResponse<T>(data: T): RepositoryResponse<T> {
  return { 
    data, 
    error: null,
    isSuccess: true,
    isError: false,
    getErrorMessage: () => null
  };
}

/**
 * Create an error response for repository operations
 */
export function createErrorResponse<T>(error: RepositoryError | string | Error): RepositoryResponse<T> {
  let formattedError: RepositoryError;
  
  if (typeof error === 'string') {
    formattedError = {
      code: 'ERROR',
      message: error,
      details: {}
    };
  } else if (error instanceof Error) {
    formattedError = {
      code: 'ERROR',
      message: error.message,
      details: { stack: error.stack }
    };
  } else {
    formattedError = error;
  }
  
  return {
    data: null, 
    error: formattedError,
    isSuccess: false,
    isError: true,
    getErrorMessage: () => formattedError.message
  };
}

/**
 * Handle repository errors with consistent formatting
 */
export function handleRepositoryError(error: any, context: string): RepositoryError {
  // Log the error
  logger.error(`Repository error in ${context}:`, error);
  
  // Format the error based on its type
  return formatRepositoryError(error);
}

/**
 * Format various error types into a consistent repository error
 */
export function formatRepositoryError(error: any): RepositoryError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown repository error occurred',
      details: {}
    };
  }
  
  // If it's already a repository error, return it
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as RepositoryError;
  }
  
  // If it's a standard Error
  if (error instanceof Error) {
    return {
      code: 'ERROR',
      message: error.message,
      details: { stack: error.stack }
    };
  }
  
  // If it's a string
  if (typeof error === 'string') {
    return {
      code: 'ERROR',
      message: error,
      details: {}
    };
  }
  
  // For Supabase PostgrestError or other structured errors
  if (typeof error === 'object') {
    // Try to extract code and message
    const code = error.code || error.statusCode || 'ERROR';
    const message = error.message || error.error || 'Repository operation failed';
    
    return {
      code: String(code),
      message: String(message),
      details: { ...error }
    };
  }
  
  // Default case
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error) || 'Unknown repository error occurred',
    details: {}
  };
}
