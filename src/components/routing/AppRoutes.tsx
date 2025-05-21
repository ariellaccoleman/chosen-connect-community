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
import HubDetail from '@/pages/HubDetail';

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

// Add Feed import
import Feed from '@/pages/Feed';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={APP_ROUTES.HOME} element={<Index />} />
      <Route path={APP_ROUTES.ABOUT} element={<About />} />
      <Route path={APP_ROUTES.AUTH} element={<PublicRoute><Auth /></PublicRoute>} />
      
      {/* Feed page */}
      <Route path={APP_ROUTES.FEED} element={<Feed />} />
      
      {/* Profile routes */}
      <Route path={APP_ROUTES.PROFILE_VIEW} element={<ProfileView />} />
      <Route path={APP_ROUTES.PROFILE_EDIT} element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.MANAGE_CONNECTIONS} element={<ProtectedRoute><ManageOrganizationConnections /></ProtectedRoute>} />
      
      {/* Community routes */}
      <Route path={APP_ROUTES.COMMUNITY} element={<CommunityDirectory />} />
      <Route path={APP_ROUTES.COMMUNITY_GUIDE} element={<CommunityGuide />} />
      
      {/* Event routes */}
      <Route path={APP_ROUTES.EVENTS} element={<Events />} />
      <Route path={APP_ROUTES.EVENT_DETAIL} element={<EventDetail />} />
      <Route path={APP_ROUTES.EVENT_CREATE} element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      
      {/* Organization routes */}
      <Route path={APP_ROUTES.ORGANIZATIONS} element={<Organizations />} />
      <Route path={APP_ROUTES.ORGANIZATION_DETAIL} element={<OrganizationDetail />} />
      <Route path={APP_ROUTES.ORGANIZATION_EDIT} element={<ProtectedRoute><OrganizationEdit /></ProtectedRoute>} />
      <Route path={APP_ROUTES.CREATE_ORGANIZATION} element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
      
      {/* Hub routes */}
      <Route path={APP_ROUTES.HUBS} element={<Hubs />} />
      <Route path={APP_ROUTES.HUB_DETAIL} element={<HubDetail />} />
      
      {/* Chat routes */}
      <Route path={APP_ROUTES.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path={APP_ROUTES.CHAT_CHANNEL} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      
      {/* Dashboard */}
      <Route path={APP_ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TAGS} element={<AdminRoute><AdminTags /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TEST_REPORTS} element={<AdminRoute><AdminTestReports /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_TEST_RUN_DETAIL} element={<AdminRoute><AdminTestRunDetail /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_DATA_GENERATOR} element={<AdminRoute><TestDataGenerator /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_CHAT_CHANNELS} element={<AdminRoute><AdminChatChannels /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_CHAT_CHANNEL_CREATE} element={<AdminRoute><CreateChatChannel /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_CHAT_CHANNEL_EDIT} element={<AdminRoute><EditChatChannel /></AdminRoute>} />
      <Route path={APP_ROUTES.ADMIN_HUBS} element={<AdminRoute><AdminHubs /></AdminRoute>} />
      
      {/* 404 page */}
      <Route path={APP_ROUTES.NOT_FOUND} element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
