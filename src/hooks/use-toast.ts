
import { toast } from "sonner";
import { useToast as useShadcnToast } from "@/components/ui/use-toast";

// Re-export both toast functions to maintain compatibility
export { toast };
export const useToast = useShadcnToast;
