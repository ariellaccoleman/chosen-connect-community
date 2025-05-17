
/**
 * @deprecated Import from @/utils/toast instead
 * This file is maintained for backwards compatibility and will be removed in a future update
 */
import { 
  toast, 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast, 
  showWarningToast,
  createEntityToasts,
  createMutationHandlers,
  extractErrorMessage 
} from "./toast";
import { logger } from "./logger";
import { isRepositoryError } from "./errorUtils";

// Re-export the toast functionality from the new location
export { 
  toast, 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast, 
  showWarningToast,
  createEntityToasts,
  createMutationHandlers,
  extractErrorMessage
};

/**
 * Helper function to handle repository response errors and show toasts
 * @deprecated Use directly from utils/toast instead
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
