
// Re-export toast functionality from our standardized location
import { toast, useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from "@/utils/toast";

// Export both toast APIs to maintain compatibility
export { toast, useToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast };
