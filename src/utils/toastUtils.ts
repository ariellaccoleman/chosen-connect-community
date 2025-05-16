
import { toast } from "@/components/ui/sonner";
import { logger } from "./logger";

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
      const errorMessage = error?.message || "An unknown error occurred";
      
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
