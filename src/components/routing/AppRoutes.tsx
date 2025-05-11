
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PublicRoute from "./PublicRoute";

import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ProfileEdit from "@/pages/ProfileEdit";
import ProfileView from "@/pages/ProfileView";
import Organizations from "@/pages/Organizations";
import OrganizationDetail from "@/pages/OrganizationDetail";
import OrganizationEdit from "@/pages/OrganizationEdit";
import ManageOrganizationConnections from "@/pages/ManageOrganizationConnections";
import CommunityDirectory from "@/pages/CommunityDirectory";
import CreateOrganization from "@/pages/CreateOrganization";
import TestDataGenerator from "@/pages/TestDataGenerator";
import About from "@/pages/About";
import CommunityGuide from "@/components/community-guide/CommunityGuide";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminTags from "@/pages/AdminTags";

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

export default AppRoutes;
