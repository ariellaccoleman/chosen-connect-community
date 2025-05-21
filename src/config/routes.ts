
import { generatePath } from 'react-router-dom';

/**
 * Application routes
 */
export const APP_ROUTES = {
  // Main Routes
  HOME: "/",
  ABOUT: "/about",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  NOT_FOUND: "*",
  
  // Community Routes
  COMMUNITY: "/community",
  PROFILE_VIEW: "/profile/:profileId",
  PROFILE_EDIT: "/profile/edit/:profileId?",
  COMMUNITY_GUIDE: "/community-guide",
  
  // Organization Routes
  ORGANIZATIONS: "/organizations",
  ORGANIZATION_DETAIL: "/organizations/:orgId",
  ORGANIZATION_EDIT: "/organizations/:orgId/edit",
  CREATE_ORGANIZATION: "/organizations/create",
  MANAGE_ORGANIZATION_CONNECTIONS: "/organizations/:orgId/connections",
  MANAGE_ORGANIZATIONS: "/manage-organizations",
  
  // Event Routes
  EVENTS: "/events",
  EVENT_DETAIL: "/events/:eventId",
  CREATE_EVENT: "/events/create",
  
  // Chat Routes
  CHAT: "/chat",
  CHAT_CHANNEL: "/chat/:channelId",
  
  // Hub Routes
  HUBS: "/hubs",
  HUB_DETAIL: "/hubs/:hubId",
  
  // Admin Routes
  ADMIN_DASHBOARD: "/admin",
  ADMIN_TAGS: "/admin/tags",
  ADMIN_CHAT_CHANNELS: "/admin/chat/channels",
  CREATE_CHAT_CHANNEL: "/admin/chat/channels/create",
  EDIT_CHAT_CHANNEL: "/admin/chat/channels/:channelId/edit",
  TEST_DATA_GENERATOR: "/admin/test-data",
  TEST_REPORTS: "/admin/test-reports",
  ADMIN_TESTS: "/admin/test-reports",
  TEST_RUN_DETAIL: "/admin/test-reports/:testRunId",
  ADMIN_TEST_DETAIL: "/admin/test-reports/:testRunId",
  ADMIN_HUBS: "/admin/hubs"
};
