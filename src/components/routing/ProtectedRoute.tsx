
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Prevent redirection loop by checking if we're being redirected from auth
  const isRedirectFromAuth = location.state && location.state.from === "/auth";

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

  // If not authenticated and not being redirected from auth, redirect to auth
  if (!user && !isRedirectFromAuth) {
    console.log("ProtectedRoute: User is not authenticated, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // If authenticated or already being redirected from auth, show the protected content
  console.log("ProtectedRoute: User is authenticated or already redirected, showing protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
