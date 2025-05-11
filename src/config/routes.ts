
import { ReactNode } from "react";

// Page components
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

export type RouteConfig = {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  auth?: 'public' | 'protected' | 'admin';
  layout?: 'default' | 'none';
  title?: string;
  children?: RouteConfig[];
};

// Organize routes by feature area
const routes: RouteConfig[] = [
  // Public routes
  {
    path: "/",
    component: Index,
    exact: true,
    auth: "public",
    layout: "default",
    title: "Home"
  },
  {
    path: "/about",
    component: About,
    exact: true,
    auth: "public",
    layout: "default",
    title: "About"
  },
  {
    path: "/community-guide",
    component: CommunityGuide,
    exact: true,
    auth: "public",
    layout: "default",
    title: "Community Guide"
  },
  {
    path: "/auth",
    component: Auth,
    exact: true,
    auth: "public",
    layout: "none",
    title: "Authentication"
  },
  
  // Protected routes
  {
    path: "/dashboard",
    component: Dashboard,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Dashboard"
  },
  {
    path: "/profile",
    component: ProfileEdit,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Edit Profile"
  },
  {
    path: "/organizations",
    component: Organizations,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Organizations"
  },
  {
    path: "/organizations/new",
    component: CreateOrganization,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Create Organization"
  },
  {
    path: "/organizations/:id",
    component: OrganizationDetail,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Organization Details"
  },
  {
    path: "/organizations/:id/edit",
    component: OrganizationEdit,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Edit Organization"
  },
  {
    path: "/organizations/manage",
    component: ManageOrganizationConnections,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Manage Organization Connections"
  },
  {
    path: "/directory",
    component: CommunityDirectory,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Community Directory"
  },
  {
    path: "/directory/:id",
    component: ProfileView,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Profile View"
  },
  
  // Admin routes
  {
    path: "/admin",
    component: AdminDashboard,
    exact: true,
    auth: "admin",
    layout: "default",
    title: "Admin Dashboard"
  },
  {
    path: "/admin/generate-test-data",
    component: TestDataGenerator,
    exact: true,
    auth: "protected",
    layout: "default",
    title: "Generate Test Data"
  },
  {
    path: "/admin/tags",
    component: AdminTags,
    exact: true,
    auth: "admin",
    layout: "default",
    title: "Admin Tags"
  },
  
  // Catch-all route (404)
  {
    path: "*",
    component: NotFound,
    layout: "default",
    title: "Page Not Found"
  }
];

export default routes;
