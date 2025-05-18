
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
  
  console.log("PublicRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname,
    from,
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
        if (user) {
          console.log("PublicRoute: User is authenticated, will redirect to", from);
          setShouldRedirect(true);
        } else {
          console.log("PublicRoute: User is not authenticated, showing public content");
        }
      }, 100); 
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, initialized, from]);

  // Show a loading skeleton while checking authentication or not yet initialized
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
    console.log("PublicRoute: Redirecting to", from);
    return <Navigate to={from} replace />;
  }

  // If not authenticated or still determining, show the public content
  return <>{children}</>;
};

export default PublicRoute;
