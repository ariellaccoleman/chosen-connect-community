
// Re-export toast functionality from our standardized location
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

// Export both toast APIs to maintain compatibility
export { useToast, toast };
