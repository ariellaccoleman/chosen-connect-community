
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ScrollToTop from "./components/layout/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import ProfileView from "./pages/ProfileView";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import OrganizationEdit from "./pages/OrganizationEdit";
import ManageOrganizationConnections from "./pages/ManageOrganizationConnections";
import CommunityDirectory from "./pages/CommunityDirectory";
import CreateOrganization from "./pages/CreateOrganization";
import TestDataGenerator from "./pages/TestDataGenerator";
import About from "./pages/About";
import CommunityGuide from "./components/community-guide/CommunityGuide";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTags from "./pages/AdminTags";

const queryClient = new QueryClient();

// Component that checks if user is authenticated and redirects accordingly
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // While checking authentication status, show nothing
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated, show the protected content
  return <>{children}</>;
};

// Component that checks if user is admin and redirects accordingly
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
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

// Component that redirects authenticated users away from public pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        } 
      />
      <Route 
        path="/about" 
        element={<About />} 
      />
      <Route 
        path="/community-guide" 
        element={<CommunityGuide />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfileEdit />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/organizations" 
        element={
          <ProtectedRoute>
            <Organizations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/organizations/new" 
        element={
          <ProtectedRoute>
            <CreateOrganization />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/organizations/:id" 
        element={
          <ProtectedRoute>
            <OrganizationDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/organizations/:id/edit" 
        element={
          <ProtectedRoute>
            <OrganizationEdit />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/organizations/manage" 
        element={
          <ProtectedRoute>
            <ManageOrganizationConnections />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/directory" 
        element={
          <ProtectedRoute>
            <CommunityDirectory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/directory/:id" 
        element={
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/generate-test-data" 
        element={
          <ProtectedRoute>
            <TestDataGenerator />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/tags" 
        element={<AdminTags />} 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ScrollToTop />
          <AppRoutes />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
