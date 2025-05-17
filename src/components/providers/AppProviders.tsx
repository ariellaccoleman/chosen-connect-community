
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <LayoutProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </LayoutProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </DebugProvider>
  );
};

export default AppProviders;
