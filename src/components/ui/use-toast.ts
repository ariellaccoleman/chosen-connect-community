
// Re-export toast functionality from our standardized location
import { toast } from "sonner";
import { toast as showToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from "@/utils/toast";

// Export both toast APIs to maintain compatibility
export { toast, showToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast };
