
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  
  console.log("ProtectedRoute:", { 
    user: !!user, 
    loading, 
    initialized,
    pathname: location.pathname
  });

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

  // Only redirect if we're fully initialized and no user is found
  if (!user && initialized) {
    console.log("ProtectedRoute: User is not authenticated, redirecting to auth");
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, show the protected content
  console.log("ProtectedRoute: User is authenticated, showing protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
