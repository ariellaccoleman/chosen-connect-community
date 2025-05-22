
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Add clear debug logs
  console.log("📍 ProtectedRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname,
  });

  // Determine when to redirect in a side effect to avoid
  // render phase state updates
  useEffect(() => {
    if (!loading && initialized && !user) {
      console.log("🚫 ProtectedRoute: No authenticated user, redirecting to auth");
      setShouldRedirect(true);
    }
  }, [user, loading, initialized, location.pathname]);

  // Show loading skeleton while checking authentication or not yet initialized
  if (loading || !initialized) {
    console.log("⏳ ProtectedRoute: Still loading or initializing auth state");
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Perform the actual redirect if needed
  if (shouldRedirect) {
    console.log("🔄 ProtectedRoute: Redirecting to auth");
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, show the protected content
  if (user) {
    console.log("✅ ProtectedRoute: User is authenticated, showing protected content");
    return <>{children}</>;
  }

  // If we get here, we're in an intermediate state - show loading
  return (
    <div className="container py-8">
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
};

export default ProtectedRoute;
