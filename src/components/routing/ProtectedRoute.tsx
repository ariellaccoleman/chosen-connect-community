
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
  
  console.log("ProtectedRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname,
    shouldRedirect
  });

  // Use effect with proper dependencies to prevent redirect loops
  useEffect(() => {
    // Only run this effect when we have definitive authentication information
    if (!loading && initialized && !redirectChecked.current) {
      // Mark that we've performed the redirect check
      redirectChecked.current = true;
      
      // Debounce the redirect decision with a short delay
      const timer = setTimeout(() => {
        if (!user) {
          console.log("ProtectedRoute: User is not authenticated, will redirect to auth");
          setShouldRedirect(true);
        } else {
          console.log("ProtectedRoute: User is authenticated, showing protected content");
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, initialized]);

  // Show loading skeleton while checking authentication or not yet initialized
  if (loading || !initialized) {
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

  // Redirect if necessary, but only after our effect has run
  if (shouldRedirect) {
    console.log("ProtectedRoute: Redirecting to auth");
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // If authenticated or still determining, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
