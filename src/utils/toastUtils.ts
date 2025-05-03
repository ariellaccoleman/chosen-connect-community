
import { toast } from "@/components/ui/sonner";

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
  } = {}
) => {
  const {
    successMessage,
    errorMessagePrefix = "Error",
    onSuccessCallback,
    onErrorCallback,
  } = options;

  return {
    onSuccess: (data: any, variables: any) => {
      // Show success toast after operation completes successfully
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Call additional success callback if provided
      if (onSuccessCallback) {
        onSuccessCallback(data, variables);
      }
    },
    onError: (error: any) => {
      // Show error toast
      const errorMessage = error?.message || "An unknown error occurred";
      toast.error(`${errorMessagePrefix}: ${errorMessage}`);
      
      // Call additional error callback if provided
      if (onErrorCallback) {
        onErrorCallback(error);
      }
    }
  };
};
