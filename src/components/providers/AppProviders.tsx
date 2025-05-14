
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { DebugProvider } from "@/contexts/DebugContext";

interface AppProvidersProps {
  children: ReactNode;
}

// Create a client with custom error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        }
      }
    },
    mutations: {
      meta: {
        onError: (error: Error) => {
          console.error('Mutation error:', error);
        }
      }
    },
  },
});

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <DebugProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LayoutProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </LayoutProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </DebugProvider>
  );
};

export default AppProviders;
