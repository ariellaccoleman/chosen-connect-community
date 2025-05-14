
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // If authenticated, redirect to dashboard
  // Add a state to prevent redirect loops
  if (user) {
    console.log("PublicRoute: User is authenticated, redirecting to dashboard");
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  // If not authenticated, show the public content
  console.log("PublicRoute: User is not authenticated, showing public content");
  return <>{children}</>;
};

export default PublicRoute;
