
import { Routes, Route } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';

// Public Routes
import Index from '@/pages/Index';
import About from '@/pages/About';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import CommunityGuide from '@/pages/CommunityGuide';

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
import Hubs from '@/pages/Hubs';

// Chat Routes
import Chat from '@/pages/Chat';

// Admin Routes
import AdminDashboard from '@/pages/AdminDashboard';
import AdminTags from '@/pages/AdminTags';
import AdminTestReports from '@/pages/AdminTestReports';
import AdminTestRunDetail from '@/pages/AdminTestRunDetail';
import AdminChatChannels from '@/pages/AdminChatChannels';
import CreateChatChannel from '@/pages/CreateChatChannel';
import EditChatChannel from '@/pages/EditChatChannel';
import AdminHubs from '@/pages/AdminHubs';

// Route Guards
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Events Routes
import CreateEvent from '@/pages/CreateEvent';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={APP_ROUTES.HOME} element={<Index />} />
      <Route path={APP_ROUTES.ABOUT} element={<About />} />
      <Route path={APP_ROUTES.AUTH} element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path={APP_ROUTES.COMMUNITY_GUIDE} element={<CommunityGuide />} />
      
      {/* Protected Routes */}
      <Route path={APP_ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path={APP_ROUTES.PROFILE_EDIT} element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.PROFILE_VIEW} element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
      <Route path={APP_ROUTES.ORGANIZATIONS} element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
      <Route path={APP_ROUTES.CREATE_ORGANIZATION} element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
      <Route path={APP_ROUTES.ORGANIZATION_DETAIL} element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
      <Route path={APP_ROUTES.ORGANIZATION_EDIT} element={<ProtectedRoute><OrganizationEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.MANAGE_ORGANIZATIONS} element={<ProtectedRoute><ManageOrganizationConnections /></ProtectedRoute>} />
      
      {/* Community Routes - Updated to match organization pattern */}
      <Route path={APP_ROUTES.COMMUNITY} element={<ProtectedRoute><CommunityDirectory /></ProtectedRoute>} />
      <Route path={APP_ROUTES.COMMUNITY_PROFILE} element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
      
      {/* Event Routes */}
      <Route path={APP_ROUTES.CREATE_EVENT} element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path={APP_ROUTES.EVENTS} element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path={APP_ROUTES.EVENT_DETAIL} element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      
      {/* Hub Routes */}
      <Route path={APP_ROUTES.HUBS} element={<ProtectedRoute><Hubs /></ProtectedRoute>} />
      
      {/* Chat Routes */}
      <Route path={APP_ROUTES.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path={APP_ROUTES.CHAT_CHANNEL} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TAGS} element={<AdminRoute><AdminTags /></AdminRoute>} />
      <Route path={APP_ROUTES.TEST_DATA_GENERATOR} element={<AdminRoute><TestDataGenerator /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TESTS} element={<AdminRoute><AdminTestReports /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TEST_DETAIL} element={<AdminRoute><AdminTestRunDetail /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_HUBS} element={<AdminRoute><AdminHubs /></AdminRoute>} />
      
      {/* Admin Chat Channel Routes */}
      <Route path={APP_ROUTES.ADMIN_CHAT_CHANNELS} element={<AdminRoute><AdminChatChannels /></AdminRoute>} />
      <Route path={APP_ROUTES.CREATE_CHAT_CHANNEL} element={<AdminRoute><CreateChatChannel /></AdminRoute>} />
      <Route path={APP_ROUTES.EDIT_CHAT_CHANNEL} element={<AdminRoute><EditChatChannel /></AdminRoute>} />
      
      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
