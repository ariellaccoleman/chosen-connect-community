
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import BaseLayout from "@/components/layout/BaseLayout";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading, initialized } = useAuth();
  const [ready, setReady] = useState(false);
  const stateChecked = useRef(false);

  // Add debug log
  console.log("DashboardLayout - Auth state:", { 
    user: !!user, 
    loading,
    initialized,
    ready,
    stateChecked: stateChecked.current
  });

  // Use effect to debounce state determination with increased timeout
  useEffect(() => {
    if (!loading && initialized && !stateChecked.current) {
      stateChecked.current = true;
      
      // Increase debounce delay
      const timer = setTimeout(() => {
        setReady(true);
      }, 250); // Increased from 100ms to 250ms
      
      return () => clearTimeout(timer);
    }
  }, [loading, initialized]);

  // Show loading skeleton when auth state is loading, not initialized, or still determining
  if (loading || !initialized || !ready) {
    return (
      <BaseLayout>
        <div className="container py-8">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </BaseLayout>
    );
  }

  // Return null when no user is authenticated - this lets ProtectedRoute handle the redirect
  if (!user) {
    return null;
  }

  return (
    <BaseLayout>
      {children}
    </BaseLayout>
  );
};

export default DashboardLayout;
