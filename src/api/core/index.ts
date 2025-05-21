
// Export domain-specific APIs
export * from './apiClient';
export * from './apiExtension';
// Explicitly re-export specific members from errorHandler to avoid ambiguity
export { handleApiError, formatError } from './errorHandler';
export * from './factory';
export * from './repository';
export * from './typedRpc';
export type { ApiResponse } from './types';

// Add error toast helper
export const showErrorToast = (error: any, defaultMessage: string = 'An error occurred') => {
  const errorMessage = error?.message || defaultMessage;
  console.error(errorMessage, error);
  
  // Return the error message for display in toast
  return errorMessage;
};
