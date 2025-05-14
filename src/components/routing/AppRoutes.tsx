
import { Routes, Route } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';

// Public Routes
import Index from '@/pages/Index';
import About from '@/pages/About';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Protected Routes
import Dashboard from '@/pages/Dashboard';
import ProfileEdit from '@/pages/ProfileEdit';
import ProfileView from '@/pages/ProfileView';
import Organizations from '@/pages/Organizations';
import CreateOrganization from '@/pages/CreateOrganization';
import OrganizationDetail from '@/pages/OrganizationDetail';
import OrganizationEdit from '@/pages/OrganizationEdit';
import ManageOrganizationConnections from '@/pages/ManageOrganizationConnections';
import CommunityDirectory from '@/pages/CommunityDirectory';
import TestDataGenerator from '@/pages/TestDataGenerator';

// Admin Routes
import AdminDashboard from '@/pages/AdminDashboard';
import AdminTags from '@/pages/AdminTags';

// Route Guards
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Events Routes
import CreateEvent from '@/pages/CreateEvent';
import Events from '@/pages/Events';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={APP_ROUTES.HOME} element={<Index />} />
      <Route path={APP_ROUTES.ABOUT} element={<About />} />
      <Route path={APP_ROUTES.AUTH} element={<PublicRoute><Auth /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path={APP_ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.PROFILE_EDIT} element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.PROFILE_VIEW} element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
      <Route path={APP_ROUTES.ORGANIZATIONS} element={<Organizations />} />
      <Route path={APP_ROUTES.CREATE_ORGANIZATION} element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
      <Route path={APP_ROUTES.ORGANIZATION_DETAIL} element={<OrganizationDetail />} />
      <Route path={APP_ROUTES.ORGANIZATION_EDIT} element={<ProtectedRoute><OrganizationEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.MANAGE_ORGANIZATIONS} element={<ProtectedRoute><ManageOrganizationConnections /></ProtectedRoute>} />
      <Route path={APP_ROUTES.COMMUNITY} element={<CommunityDirectory />} />
      
      {/* Event Routes - Make sure they are protected */}
      <Route path={APP_ROUTES.CREATE_EVENT} element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path={APP_ROUTES.EVENTS} element={<ProtectedRoute><Events /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TAGS} element={<AdminRoute><AdminTags /></AdminRoute>} />
      <Route path={APP_ROUTES.TEST_DATA_GENERATOR} element={<AdminRoute><TestDataGenerator /></AdminRoute>} />
      
      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
