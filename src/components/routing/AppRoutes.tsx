
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
    
    // For dashboard layout, use the DashboardLayout component
    if (route.auth === "protected") {
      return (
        <ProtectedRoute>
          {route.component === Layout ? (
            <Component />
          ) : route.layout === 'default' ? (
            <Layout includeNavbar={true}>
              <Component />
            </Layout>
          ) : (
            <Component />
          )}
        </ProtectedRoute>
      );
    } else if (route.auth === "admin") {
      return (
        <AdminRoute>
          {route.component === Layout ? (
            <Component />
          ) : route.layout === 'default' ? (
            <Layout includeNavbar={true}>
              <Component />
            </Layout>
          ) : (
            <Component />
          )}
        </AdminRoute>
      );
    } else if (route.auth === "public") {
      return (
        <PublicRoute>
          {route.component === Layout ? (
            <Component />
          ) : route.layout === 'default' ? (
            <Layout includeNavbar={true}>
              <Component />
            </Layout>
          ) : (
            <Component />
          )}
        </PublicRoute>
      );
    }
    
    // For any other route type
    return route.component === Layout ? (
      <Component />
    ) : route.layout === 'default' ? (
      <Layout includeNavbar={true}>
        <Component />
      </Layout>
    ) : (
      <Component />
    );
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
