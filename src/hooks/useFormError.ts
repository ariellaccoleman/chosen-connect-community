
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/errorUtils";
import { logger } from "@/utils/logger";

/**
 * Hook for handling form errors in a standardized way
 */
export const useFormError = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown) => {
    const errorMessage = extractErrorMessage(error);
    
    // Log for debugging
    logger.error("Form error:", error);
    
    // Set the error state 
    setError(errorMessage);
    
    // Show toast notification
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
