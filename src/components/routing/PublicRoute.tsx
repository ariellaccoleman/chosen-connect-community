
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Get redirect target from state if available
  const redirectTo = location.state?.redirectTo || "/dashboard";
  
  // Show a loading skeleton while checking authentication
  if (loading) {
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

  // If authenticated, redirect to the target location or dashboard
  if (user) {
    console.log("PublicRoute: User is authenticated, redirecting to", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, show the public content
  console.log("PublicRoute: User is not authenticated, showing public content");
  return <>{children}</>;
};

export default PublicRoute;
