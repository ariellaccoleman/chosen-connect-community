
import { toast } from "@/components/ui/sonner";
import { logger } from "./logger";
import { RepositoryError } from '@/api/core/repository/DataRepository';

/**
 * Helper function to handle toast notifications for mutations
 * Ensures toast notifications are shown only after backend operations complete
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
      // Only show if there's actual data (a change was made)
      if (successMessage && data !== null) {
        toast.success(successMessage);
      }
      
      // Call additional success callback if provided
      if (onSuccessCallback) {
        onSuccessCallback(data, variables);
      }
    },
    onError: (error: any) => {
      // Extract error message from different error formats
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

/**
 * Helper function to extract error messages from different error types
 * Works with ApiErrors, RepositoryErrors, or simple Error objects
 */
export const extractErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";
  
  // Handle RepositoryError type
  if (error.code && error.message) {
    return error.message;
  }

  // Handle standard Error objects
  if (error.message) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle nested error objects
  if (error.error?.message) {
    return error.error.message;
  }
  
  return "An unknown error occurred";
};

/**
 * Create standardized toast messages for entity operations
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
 * Helper function to handle repository response errors and show toasts
 */
export const handleRepositoryResponseError = (
  response: { error: any; status?: string }, 
  options: { 
    entityName?: string; 
    operation?: 'create' | 'update' | 'delete' | 'fetch'; 
    customMessage?: string 
  } = {}
) => {
  // Skip if no error
  if (!response.error) return false;
  
  const { entityName = "Item", operation = "fetch", customMessage } = options;
  
  // Extract error message
  const errorMessage = extractErrorMessage(response.error);
  
  // Build toast message
  const message = customMessage || `Failed to ${operation} ${entityName}: ${errorMessage}`;
  
  // Show toast
  toast.error(message);
  
  // Log error
  logger.error(`Repository error (${operation} ${entityName}):`, response.error);
  
  return true;
};
