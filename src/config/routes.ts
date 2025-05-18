
/**
 * Application routes
 */
export const APP_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_VIEW: '/profile/:id',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DETAIL: '/organizations/:id',
  ORGANIZATION_EDIT: '/organizations/:id/edit',
  CREATE_ORGANIZATION: '/organizations/create',
  MANAGE_ORGANIZATIONS: '/profile/organizations',
  COMMUNITY: '/community',
  COMMUNITY_GUIDE: '/community-guide',
  
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:id',
  CREATE_EVENT: '/events/create',
  
  // Chat routes
  CHAT: '/chat',
  CHAT_CHANNEL: '/chat/:channelId',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TAGS: '/admin/tags',
  TEST_DATA_GENERATOR: '/admin/test-data-generator',
  ADMIN_TESTS: '/admin/tests',
  ADMIN_TEST_DETAIL: '/admin/tests/:id',
  ADMIN_CHAT_CHANNELS: '/admin/chat/channels',
  CREATE_CHAT_CHANNEL: '/admin/chat/channels/create',
  EDIT_CHAT_CHANNEL: '/admin/chat/channels/:id/edit'
};
