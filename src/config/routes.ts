import { generatePath } from 'react-router-dom';

export const APP_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_VIEW: '/profile/:profileId',
  ORGANIZATIONS: '/organizations',
  CREATE_ORGANIZATION: '/organizations/create',
  ORGANIZATION_DETAIL: '/organizations/:orgId',
  ORGANIZATION_EDIT: '/organizations/:orgId/edit',
  MANAGE_ORGANIZATIONS: '/organizations/manage-connections',
  COMMUNITY: '/directory',
  COMMUNITY_GUIDE: '/community-guide',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_TAGS: '/admin/tags',
  TEST_DATA_GENERATOR: '/admin/test-data-generator',

  // Events
  CREATE_EVENT: '/events/create',
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:eventId',
};

export const ROUTE_ACCESS = {
  [APP_ROUTES.HOME]: { requiresAuth: false },
  [APP_ROUTES.ABOUT]: { requiresAuth: false },
  [APP_ROUTES.AUTH]: { requiresAuth: false },
  [APP_ROUTES.DASHBOARD]: { requiresAuth: true },
  [APP_ROUTES.PROFILE_EDIT]: { requiresAuth: true },
  [APP_ROUTES.PROFILE_VIEW]: { requiresAuth: false }, // Set to public access
  [APP_ROUTES.ORGANIZATIONS]: { requiresAuth: false },
  [APP_ROUTES.CREATE_ORGANIZATION]: { requiresAuth: true },
  [APP_ROUTES.ORGANIZATION_DETAIL]: { requiresAuth: false },
  [APP_ROUTES.ORGANIZATION_EDIT]: { requiresAuth: true },
  [APP_ROUTES.MANAGE_ORGANIZATIONS]: { requiresAuth: true },
  [APP_ROUTES.COMMUNITY]: { requiresAuth: false },
  [APP_ROUTES.COMMUNITY_GUIDE]: { requiresAuth: false },
  [APP_ROUTES.ADMIN_DASHBOARD]: { requiresAuth: true, requiresAdmin: true },
  [APP_ROUTES.ADMIN_TAGS]: { requiresAuth: true, requiresAdmin: true },
  [APP_ROUTES.TEST_DATA_GENERATOR]: { requiresAuth: true, requiresAdmin: true },

  // Events - Update to require authentication
  [APP_ROUTES.CREATE_EVENT]: { requiresAuth: true },
  [APP_ROUTES.EVENTS]: { requiresAuth: true },
  [APP_ROUTES.EVENT_DETAIL]: { requiresAuth: true },
};

export const getRoutesConfig = () => {
  return [
    {
      path: APP_ROUTES.HOME,
      id: 'home',
      label: 'Home',
      showInNav: true,
    },
    {
      path: APP_ROUTES.ABOUT,
      id: 'about',
      label: 'About',
      showInNav: true,
    },
    {
      path: APP_ROUTES.COMMUNITY,
      id: 'community',
      label: 'Community',
      showInNav: true,
    },
    {
      path: APP_ROUTES.COMMUNITY_GUIDE,
      id: 'community-guide',
      label: 'Community Guide',
      showInNav: true,
    },
    {
      path: APP_ROUTES.DASHBOARD,
      id: 'dashboard',
      label: 'Dashboard',
      showInNav: false,
    },
    {
      path: APP_ROUTES.PROFILE_EDIT,
      id: 'profile-edit',
      label: 'Edit Profile',
      showInNav: false,
    },
    {
      path: APP_ROUTES.PROFILE_VIEW,
      id: 'profile-view',
      label: 'View Profile',
      showInNav: false,
    },
    {
      path: APP_ROUTES.ORGANIZATIONS,
      id: 'organizations',
      label: 'Organizations',
      showInNav: true,
    },
    {
      path: APP_ROUTES.CREATE_ORGANIZATION,
      id: 'create-organization',
      label: 'Create Organization',
      showInNav: false,
    },
    {
      path: APP_ROUTES.ORGANIZATION_DETAIL,
      id: 'organization-detail',
      label: 'Organization Detail',
      showInNav: false,
    },
    {
      path: APP_ROUTES.ORGANIZATION_EDIT,
      id: 'organization-edit',
      label: 'Edit Organization',
      showInNav: false,
    },
    {
      path: APP_ROUTES.MANAGE_ORGANIZATIONS,
      id: 'manage-organization-connections',
      label: 'Manage Organization Connections',
      showInNav: false,
    },
    {
      path: APP_ROUTES.ADMIN_DASHBOARD,
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      showInNav: false,
    },
    {
      path: APP_ROUTES.ADMIN_TAGS,
      id: 'admin-tags',
      label: 'Admin Tags',
      showInNav: false,
    },
    {
      path: APP_ROUTES.TEST_DATA_GENERATOR,
      id: 'test-data-generator',
      label: 'Test Data Generator',
      showInNav: false,
    },
    
    // Events - Set to not show in navigation by default (will be shown conditionally in nav components)
    {
      path: APP_ROUTES.CREATE_EVENT,
      id: 'create-event',
      label: 'Create Event',
      showInNav: false,
    },
    {
      path: APP_ROUTES.EVENTS,
      id: 'events',
      label: 'Events',
      showInNav: false,
    },
  ];
};

export const REDIRECT_PATHS = {
  // Add events-related redirects if needed
};
