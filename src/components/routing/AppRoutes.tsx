
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

    // For routes using the 'none' layout, render the component directly without any layout
    if (route.layout === 'none') {
      return <Component />;
    }
    
    // For all other routes, apply the appropriate authentication wrapper
    // without an additional layout wrapper since the components already include Layout
    switch (route.auth) {
      case "protected":
        return <ProtectedRoute><Component /></ProtectedRoute>;
      case "admin":
        return <AdminRoute><Component /></AdminRoute>;
      case "public":
        return <PublicRoute><Component /></PublicRoute>;
      default:
        return <Component />;
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
