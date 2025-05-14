
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  // While checking authentication status, show nothing
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If not admin, redirect to dashboard
  if (user.user_metadata?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and admin, show the protected content
  return <>{children}</>;
};

export default AdminRoute;
