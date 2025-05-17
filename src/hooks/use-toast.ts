// Re-export toast functionality from Sonner
import { toast as sonnerToast } from 'sonner';
import { Toast } from "@/components/ui/toast";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

interface ToastActionElement {
  altText?: string;
  action: React.ReactNode;
}

// Keep compatibility with the expected structure from shadcn/ui toast
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Create a fake store for compatibility
const useToast = () => {
  return {
    toast: (props: any) => {
      const { title, description, variant } = props;
      if (variant === "destructive") {
        return sonnerToast.error(title, {
          description
        });
      }
      return sonnerToast.success(title, {
        description
      });
    },
    toasts: [] as ToasterToast[],
    dismiss: (id: string) => {},
  };
};

export { useToast, sonnerToast as toast };
