
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);
  const redirectChecked = useRef(false);
  
  console.log("📍 ProtectedRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname,
    shouldRedirect,
    redirectChecked: redirectChecked.current
  });

  // Only check redirect once when we have definitive auth information
  useEffect(() => {
    // Wait until auth is fully initialized and not loading
    if (initialized && !loading && !redirectChecked.current) {
      redirectChecked.current = true;
      
      if (!user) {
        console.log("🚫 ProtectedRoute: No authenticated user, preparing redirect to auth");
        // Use a consistent delay to avoid race conditions
        const timer = setTimeout(() => {
          console.log("⏱️ ProtectedRoute: Redirect delay completed, setting redirect flag");
          setShouldRedirect(true);
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.log("✅ ProtectedRoute: User is authenticated, showing protected content");
      }
    }
  }, [user, loading, initialized, location]);

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
    console.log("🔄 ProtectedRoute: Redirecting to auth from", location.pathname);
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
