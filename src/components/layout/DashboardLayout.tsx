
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BaseLayout from "@/components/layout/BaseLayout";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Show loading skeleton when auth state is loading
  if (loading) {
    return (
      <BaseLayout includeNavbar={true}>
        <div className="container py-8">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </BaseLayout>
    );
  }

  // Return null when no user is authenticated
  if (!user) {
    return null;
  }

  return (
    <BaseLayout includeNavbar={true}>
      {children}
    </BaseLayout>
  );
};

export default DashboardLayout;
