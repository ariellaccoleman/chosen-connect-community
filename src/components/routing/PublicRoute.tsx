
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  // While checking authentication status, show nothing
  if (loading) {
    return null;
  }

  // If authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the public content
  return <>{children}</>;
};

export default PublicRoute;
