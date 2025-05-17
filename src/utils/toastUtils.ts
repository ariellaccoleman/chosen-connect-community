
import { toast } from "sonner";
import { logger } from "./logger";
import { extractErrorMessage } from "./errorUtils";

/**
 * Helper function to handle toast notifications for mutations
 */
export const createMutationHandlers = (
  options: {
    successMessage?: string;
    errorMessagePrefix?: string;
    onSuccessCallback?: (data: any, variables: any) => void;
    onErrorCallback?: (error: any) => void;
    logError?: boolean;
    logSuccess?: boolean;
  } = {}
) => {
  const {
    successMessage,
    errorMessagePrefix = "Error",
    onSuccessCallback,
    onErrorCallback,
    logError = true,
    logSuccess = true,
  } = options;

  return {
    onSuccess: (data: any, variables?: any) => {
      // Log success if enabled
      if (logSuccess && successMessage) {
        logger.info(`Success: ${successMessage}`, { data });
      }
      
      // Show success toast after operation completes successfully
      if (successMessage && data !== null) {
        toast.success(successMessage);
      }
      
      // Call additional success callback if provided
      if (onSuccessCallback) {
        onSuccessCallback(data, variables);
      }
    },
    onError: (error: any) => {
      // Extract error message 
      const errorMessage = extractErrorMessage(error);
      
      // Log error if enabled
      if (logError) {
        logger.error(`${errorMessagePrefix}: ${errorMessage}`, error);
      }
      
      // Show error toast
      toast.error(`${errorMessagePrefix}: ${errorMessage}`);
      
      // Call additional error callback if provided
      if (onErrorCallback) {
        onErrorCallback(error);
      }
    }
  };
};
