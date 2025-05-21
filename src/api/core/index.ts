
// Export domain-specific APIs
export * from './apiClient';
export * from './apiExtension';
export * from './errorHandler';
export * from './factory';
export * from './repository';
export * from './typedRpc';
export * from './types';

// Add error toast helper
export const showErrorToast = (error: any, defaultMessage: string = 'An error occurred') => {
  const errorMessage = error?.message || defaultMessage;
  console.error(errorMessage, error);
  
  // Return the error message for display in toast
  return errorMessage;
};
