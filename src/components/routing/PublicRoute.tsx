
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Prevent redirection loop by checking if we're being redirected from dashboard
  const isRedirectFromDashboard = location.state && location.state.from === "/dashboard";

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

  // If authenticated and not being redirected from dashboard, redirect to dashboard
  if (user && !isRedirectFromDashboard) {
    console.log("PublicRoute: User is authenticated, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated or already being redirected from dashboard, show the public content
  console.log("PublicRoute: User is not authenticated or already redirected, showing public content");
  return <>{children}</>;
};

export default PublicRoute;
