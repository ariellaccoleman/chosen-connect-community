
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BaseLayout from "@/components/layout/BaseLayout";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect when the auth state is fully loaded and no user exists
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Return null during loading or when no user is authenticated
  if (loading || !user) {
    return null;
  }

  return (
    <BaseLayout includeNavbar={true}>
      {children}
    </BaseLayout>
  );
};

export default DashboardLayout;
