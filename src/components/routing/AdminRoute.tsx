
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

  console.log("📍 AdminRoute:", { 
    user: !!user, 
    isAdmin, 
    loading, 
    initialized,
    pathname: location.pathname,
    redirectTo,
    redirectChecked: redirectChecked.current
  });

  // Only check redirect once when we have definitive auth information
  useEffect(() => {
    // Wait until auth is fully initialized and not loading
    if (initialized && !loading && !redirectChecked.current) {
      redirectChecked.current = true;
      
      if (!user) {
        console.log("🚫 AdminRoute: User is not authenticated, preparing redirect to auth");
        // Use a consistent delay to avoid race conditions
        const timer = setTimeout(() => {
          console.log("⏱️ AdminRoute: Redirect delay completed, setting redirect path");
          setRedirectTo("/auth");
        }, 300);
        
        return () => clearTimeout(timer);
      } else if (!isAdmin) {
        console.log("🚫 AdminRoute: User is not an admin, preparing redirect to dashboard");
        const timer = setTimeout(() => {
          console.log("⏱️ AdminRoute: Redirect delay completed, setting redirect path");
          setRedirectTo("/dashboard");
        }, 300);
        
        return () => clearTimeout(timer);
      } else {
        console.log("✅ AdminRoute: User is an admin, showing admin content");
      }
    }
  }, [user, isAdmin, loading, initialized, location]);

  // Show loading skeleton while checking authentication or not yet initialized
  if (loading || !initialized) {
    console.log("⏳ AdminRoute: Still loading or initializing auth state");
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
    console.log("🔄 AdminRoute: Redirecting to auth with return path", location.pathname);
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  if (redirectTo === "/dashboard") {
    console.log("🔄 AdminRoute: Redirecting to dashboard (not authorized)");
    return <Navigate to="/dashboard" replace />;
  }

  // Show the admin content
  return <>{children}</>;
};

export default AdminRoute;
