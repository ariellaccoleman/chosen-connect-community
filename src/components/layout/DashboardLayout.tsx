
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

  // Add clear debug log
  console.log("📍 DashboardLayout - Auth state:", { 
    user: !!user, 
    loading,
    initialized,
    ready,
    stateChecked: stateChecked.current
  });

  // Improved state determination
  useEffect(() => {
    if (initialized && !loading && !stateChecked.current) {
      stateChecked.current = true;
      
      console.log("🔍 DashboardLayout: Auth state determined, preparing to render");
      
      // Use a consistent delay to avoid race conditions
      const timer = setTimeout(() => {
        console.log("⏱️ DashboardLayout: Ready delay completed, setting ready state");
        setReady(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, initialized]);

  // Show loading skeleton while determining ready state
  if (loading || !initialized || !ready) {
    console.log("⏳ DashboardLayout: Still loading, initializing, or determining state");
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
    console.log("🚫 DashboardLayout: No authenticated user, deferring to ProtectedRoute");
    return null;
  }

  console.log("✅ DashboardLayout: Rendering with authenticated user");
  return (
    <BaseLayout>
      {children}
    </BaseLayout>
  );
};

export default DashboardLayout;
