
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import { ApiError } from "@/api/core/errorHandler";

/**
 * Hook for handling form errors in a standardized way
 */
export const useFormError = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown) => {
    console.error("Form error:", error);
    
    let errorMessage = "An unexpected error occurred. Please try again.";
    
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // This is likely our ApiError type
      errorMessage = (error as { message: string }).message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
    
    return errorMessage;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
};
