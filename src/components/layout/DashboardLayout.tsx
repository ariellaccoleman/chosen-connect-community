
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import BaseLayout from "@/components/layout/BaseLayout";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useAuth();

  // Add debug log
  console.log("DashboardLayout - Auth state:", { 
    user: !!user, 
    loading,
    redirectionDebug: "Fixed redirection in DashboardLayout" 
  });

  // Show loading skeleton when auth state is loading
  if (loading) {
    return (
      <BaseLayout>
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

  // Return null when no user is authenticated - this lets ProtectedRoute handle the redirect
  if (!user) {
    return null;
  }

  return (
    <BaseLayout>
      {children}
    </BaseLayout>
  );
};

export default DashboardLayout;
