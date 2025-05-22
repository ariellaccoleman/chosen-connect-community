
/**
 * Utility functions for repositories
 */

import { RepositoryResponse, RepositoryError } from './DataRepository';

/**
 * Create a success response for repository operations
 */
export function createSuccessResponse<T>(data: T): RepositoryResponse<T> {
  return { data, error: null };
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
  
  return { data: null, error: formattedError };
}
