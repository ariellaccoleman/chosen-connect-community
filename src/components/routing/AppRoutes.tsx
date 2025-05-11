
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PublicRoute from "./PublicRoute";
import routes, { RouteConfig } from "@/config/routes";
import Layout from "@/components/layout/Layout";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLayout } from "@/contexts/LayoutContext";
import { useEffect } from "react";

const AppRoutes = () => {
  const { setPageTitle } = useLayout();
  
  // Reset page title when component unmounts
  useEffect(() => {
    return () => {
      setPageTitle("");
    };
  }, [setPageTitle]);

  // Function to render a route with the appropriate wrapper
  const renderRoute = (route: RouteConfig) => {
    const Component = route.component;
    
    // Set page title when route changes
    useEffect(() => {
      if (route.title) {
        setPageTitle(route.title);
      }
    }, [route.title]);

    // Determine the layout to use
    const RouteLayout = route.layout === 'none' 
      ? ({ children }: { children: React.ReactNode }) => <>{children}</>
      : DashboardLayout;
    
    // Apply the appropriate authentication wrapper
    switch (route.auth) {
      case "protected":
        return (
          <ProtectedRoute>
            <RouteLayout>
              <Component />
            </RouteLayout>
          </ProtectedRoute>
        );
      case "admin":
        return (
          <AdminRoute>
            <RouteLayout>
              <Component />
            </RouteLayout>
          </AdminRoute>
        );
      case "public":
        return (
          <PublicRoute>
            <RouteLayout>
              <Component />
            </RouteLayout>
          </PublicRoute>
        );
      default:
        return (
          <RouteLayout>
            <Component />
          </RouteLayout>
        );
    }
  };

  return (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={renderRoute(route)}
        />
      ))}
    </Routes>
  );
};

export default AppRoutes;
