
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect, useState } from "react";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);
  const redirectChecked = useRef(false);
  
  // Get the intended destination from location state, or use dashboard as default
  const from = location.state?.from || "/dashboard";
  
  console.log("📍 PublicRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname,
    from,
    shouldRedirect,
    redirectChecked: redirectChecked.current
  });

  // Only check redirect once when we have definitive auth information
  useEffect(() => {
    // Wait until auth is fully initialized and not loading
    if (initialized && !loading && !redirectChecked.current) {
      redirectChecked.current = true;
      
      if (user) {
        console.log("🔒 PublicRoute: User is authenticated, preparing redirect to", from);
        // Use a consistent delay to avoid race conditions
        const timer = setTimeout(() => {
          console.log("⏱️ PublicRoute: Redirect delay completed, setting redirect flag");
          setShouldRedirect(true);
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.log("✅ PublicRoute: User is not authenticated, showing public content");
      }
    }
  }, [user, loading, initialized, from, location]);

  // Show loading skeleton while checking authentication or not yet initialized
  if (loading || !initialized) {
    console.log("⏳ PublicRoute: Still loading or initializing auth state");
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
    console.log("🔄 PublicRoute: Redirecting to", from);
    return <Navigate to={from} replace />;
  }

  // Show the public content
  return <>{children}</>;
};

export default PublicRoute;
