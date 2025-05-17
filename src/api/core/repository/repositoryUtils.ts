
import { RepositoryResponse, RepositoryError } from './DataRepository';
import { logger } from '@/utils/logger';

/**
 * Create standardized repository success response
 */
export function createSuccessResponse<T>(data: T): RepositoryResponse<T> {
  return {
    data,
    error: null,
    isSuccess: () => true,
    isError: () => false,
    getErrorMessage: () => '',
  };
}

/**
 * Create standardized repository error response
 */
export function createErrorResponse<T>(error: any): RepositoryResponse<T> {
  // Format the error to match our expected structure
  const repositoryError: RepositoryError = formatRepositoryError(error);
  
  return {
    data: null,
    error: repositoryError,
    isSuccess: () => false,
    isError: () => true,
    getErrorMessage: () => repositoryError.message,
  };
}

/**
 * Format any error type into a standardized RepositoryError
 */
export function formatRepositoryError(error: any): RepositoryError {
  // Already a repository error
  if (error && error.code && typeof error.message === 'string') {
    return error as RepositoryError;
  }
  
  // Standard Error object
  if (error instanceof Error) {
    return {
      code: 'repository_error',
      message: error.message,
      details: {},
      original: error
    };
  }
  
  // String error
  if (typeof error === 'string') {
    return {
      code: 'repository_error',
      message: error,
      details: {},
      original: error
    };
  }
  
  // Object with error property
  if (error && error.error) {
    if (typeof error.error === 'string') {
      return {
        code: 'repository_error',
        message: error.error,
        details: error,
        original: error
      };
    }
    
    if (error.error.message) {
      return {
        code: error.error.code || 'repository_error',
        message: error.error.message,
        details: error.error.details || {},
        original: error
      };
    }
  }
  
  // Unknown error format
  return {
    code: 'unknown_error',
    message: error ? 
      (typeof error.toString === 'function' ? error.toString() : 'Unknown error') 
      : 'Unknown error',
    details: {},
    original: error
  };
}

/**
 * Handle repository errors with consistent logging and optional toast notifications
 */
export function handleRepositoryError(error: any, context: string): RepositoryError {
  // Log the error with context
  logger.error(`Repository Error (${context}):`, error);
  
  // Return standardized error object
  return formatRepositoryError(error);
}
