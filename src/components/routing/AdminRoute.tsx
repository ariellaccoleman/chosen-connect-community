
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect, useState } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin, initialized } = useAuth();
  const location = useLocation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const redirectChecked = useRef(false);

  console.log("AdminRoute:", { 
    user: !!user, 
    isAdmin, 
    loading, 
    initialized,
    pathname: location.pathname,
    redirectTo
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
          console.log("AdminRoute: User is not authenticated, will redirect to auth");
          setRedirectTo("/auth");
        } else if (!isAdmin) {
          console.log("AdminRoute: User is not an admin, will redirect to dashboard");
          setRedirectTo("/dashboard");
        } else {
          console.log("AdminRoute: User is an admin, showing admin content");
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, loading, initialized]);

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

  // Handle redirects if necessary
  if (redirectTo === "/auth") {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  if (redirectTo === "/dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and admin, or still determining, show the protected content
  return <>{children}</>;
};

export default AdminRoute;
