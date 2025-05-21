
import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ApiError } from '@/api/core/errorHandler';

/**
 * Hook for managing form error states and displaying error toasts
 */
export const useFormError = () => {
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle an error by setting it in state and showing a toast
   * @param err - The error to handle
   * @returns The error message
   */
  const handleError = (err: unknown): string => {
    let message: string;

    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'object' && err !== null) {
      if ('message' in err) {
        // This handles ApiError type or any object with a message property
        message = String((err as ApiError).message);
      } else {
        // Try to stringify the object for better debugging
        try {
          message = `Error: ${JSON.stringify(err)}`;
        } catch (e) {
          message = 'An error occurred (object cannot be stringified)';
        }
      }
    } else if (typeof err === 'string') {
      message = err;
    } else {
      message = 'An unknown error occurred';
    }

    logger.error('Form error:', message, err);
    setError(message);
    toast.error(message);
    
    return message;
  };

  /**
   * Clear the current error
   */
  const clearError = () => setError(null);

  return {
    error,
    handleError,
    clearError
  };
};
