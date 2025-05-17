
/**
 * Centralized toast utility using Sonner toast
 * This provides a consistent API for showing toast notifications throughout the app
 */
import { toast } from "sonner";
import { logger } from "./logger";

// Re-export the toast object for direct usage
export { toast };

// Helper functions for common toast patterns
export const showSuccessToast = (message: string) => {
  logger.info(`Success: ${message}`);
  return toast.success(message);
};

export const showErrorToast = (error: unknown, prefix = "Error") => {
  const errorMessage = extractErrorMessage(error);
  logger.error(`${prefix}: ${errorMessage}`, error);
  return toast.error(`${prefix}: ${errorMessage}`);
};

export const showInfoToast = (message: string) => {
  return toast.info(message);
};

export const showWarningToast = (message: string) => {
  return toast.warning(message);
};

// Helper to extract error messages from different error types
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (!error) return "Unknown error occurred";
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === "object") {
    // Handle error objects with message property
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
    
    // Handle nested error objects
    if ("error" in error && error.error && typeof error.error === "object") {
      if ("message" in error.error && typeof error.error.message === "string") {
        return error.error.message;
      }
    }
    
    // Last resort, stringify the error
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error format";
    }
  }
  
  return "Unknown error occurred";
};

/**
 * Helper function to create standard toast messages for entity operations
 */
export const createEntityToasts = (entityName: string, pluralName?: string) => {
  const plural = pluralName || `${entityName}s`;
  
  return {
    // Single entity operations
    created: () => toast.success(`${entityName} created successfully`),
    updated: () => toast.success(`${entityName} updated successfully`),
    deleted: () => toast.success(`${entityName} deleted successfully`),
    createError: (message?: string) => toast.error(message || `Failed to create ${entityName}`),
    updateError: (message?: string) => toast.error(message || `Failed to update ${entityName}`),
    deleteError: (message?: string) => toast.error(message || `Failed to delete ${entityName}`),
    
    // Multiple entity operations
    batchCreated: (count: number) => toast.success(`${count} ${plural} created successfully`),
    batchUpdated: (count: number) => toast.success(`${count} ${plural} updated successfully`),
    batchDeleted: (count: number) => toast.success(`${count} ${plural} deleted successfully`),
    batchCreateError: (message?: string) => toast.error(message || `Failed to create ${plural}`),
    batchUpdateError: (message?: string) => toast.error(message || `Failed to update ${plural}`),
    batchDeleteError: (message?: string) => toast.error(message || `Failed to delete ${plural}`)
  };
};

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
