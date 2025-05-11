
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
    // AND wrap with the proper layout component
    const WrappedComponent = () => {
      // Use DashboardLayout for protected and admin routes unless specified otherwise
      if ((route.auth === 'protected' || route.auth === 'admin') && route.layout !== 'default') {
        return (
          <DashboardLayout>
            <Component />
          </DashboardLayout>
        );
      }
      
      // For other routes, use the standard Layout with navbar
      return <Layout includeNavbar={true}><Component /></Layout>;
    };
    
    // Apply the appropriate authentication wrapper
    switch (route.auth) {
      case "protected":
        return <ProtectedRoute><WrappedComponent /></ProtectedRoute>;
      case "admin":
        return <AdminRoute><WrappedComponent /></AdminRoute>;
      case "public":
        return <PublicRoute><WrappedComponent /></PublicRoute>;
      default:
        return <Layout includeNavbar={true}><Component /></Layout>;
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
