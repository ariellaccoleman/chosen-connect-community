
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
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

  // If not authenticated, redirect to auth page
  if (!user) {
    console.log("AdminRoute: User is not authenticated, redirecting to auth");
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    console.log("AdminRoute: User is not an admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  // If authenticated and admin, show the protected content
  console.log("AdminRoute: User is an admin, showing admin content");
  return <>{children}</>;
};

export default AdminRoute;
