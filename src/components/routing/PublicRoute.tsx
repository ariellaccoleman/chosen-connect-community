
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Get the intended destination from location state, or use dashboard as default
  const from = location.state?.from || "/dashboard";
  
  console.log("PublicRoute:", { 
    user: !!user, 
    loading, 
    pathname: location.pathname,
    from
  });

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

  // If authenticated, redirect to the intended destination
  if (user) {
    console.log("PublicRoute: User is authenticated, redirecting to", from);
    return <Navigate to={from} replace />;
  }

  // If not authenticated, show the public content
  console.log("PublicRoute: User is not authenticated, showing public content");
  return <>{children}</>;
};

export default PublicRoute;
