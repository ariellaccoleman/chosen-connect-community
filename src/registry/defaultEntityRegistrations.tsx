
import React from "react";
import { EntityType } from "../types/entityTypes";
import { entityRegistry } from "./entityRegistry";
import { User, Building, Calendar, Layers, FileText, MessageSquare, Users, CalendarDays, Building2, Compass, FileCode } from "lucide-react";
import { 
  profileToEntity, 
  organizationToEntity, 
  eventToEntity,
  hubToEntity 
} from "../types/entity";
import { APP_ROUTES } from "@/config/routes";
import { generatePath } from "react-router-dom";
import { EntityTypeDefinition } from "@/types/entityRegistry";

// Register Person entity type
entityRegistry.register({
  type: EntityType.PERSON,
  name: "Person",
  namePlural: "People",
  icon: <User className="h-4 w-4" />,
  detailRouteName: APP_ROUTES.PROFILE_VIEW,
  convertToEntity: profileToEntity,
  behavior: {
    getDetailUrl: (id) => generatePath(APP_ROUTES.PROFILE_VIEW, { profileId: id }),
    getCreateUrl: () => APP_ROUTES.PROFILE_EDIT,
    getEditUrl: (id) => generatePath(APP_ROUTES.PROFILE_EDIT, { profileId: id }),
    getListUrl: () => APP_ROUTES.COMMUNITY,
    getIcon: () => <User className="h-4 w-4" />,
    getTypeLabel: () => "Person",
    getSingularName: () => "person",
    getPluralName: () => "people",
    getDisplayName: (entity) => entity.name,
    getFallbackInitials: (entity) => {
      if (!entity.name) return "?";
      return entity.name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
  }
});

// Register Organization entity type
entityRegistry.register({
  type: EntityType.ORGANIZATION,
  name: "Organization",
  namePlural: "Organizations",
  icon: <Building className="h-4 w-4" />,
  detailRouteName: APP_ROUTES.ORGANIZATION_DETAIL,
  convertToEntity: organizationToEntity,
  behavior: {
    getDetailUrl: (id) => generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId: id }),
    getCreateUrl: () => APP_ROUTES.CREATE_ORGANIZATION,
    getEditUrl: (id) => generatePath(APP_ROUTES.ORGANIZATION_EDIT, { orgId: id }),
    getListUrl: () => APP_ROUTES.ORGANIZATIONS,
    getIcon: () => <Building className="h-4 w-4" />,
    getTypeLabel: () => "Organization",
    getSingularName: () => "organization",
    getPluralName: () => "organizations",
    getDisplayName: (entity) => entity.name,
    getFallbackInitials: (entity) => {
      if (!entity.name) return "?";
      return entity.name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
  }
});

// Register Event entity type
entityRegistry.register({
  type: EntityType.EVENT,
  name: "Event",
  namePlural: "Events",
  icon: <Calendar className="h-4 w-4" />,
  detailRouteName: APP_ROUTES.EVENT_DETAIL,
  convertToEntity: eventToEntity,
  behavior: {
    getDetailUrl: (id) => generatePath(APP_ROUTES.EVENT_DETAIL, { eventId: id }),
    getCreateUrl: () => APP_ROUTES.CREATE_EVENT,
    getEditUrl: (id) => generatePath(APP_ROUTES.EVENT_DETAIL, { eventId: id }),
    getListUrl: () => APP_ROUTES.EVENTS,
    getIcon: () => <Calendar className="h-4 w-4" />,
    getTypeLabel: () => "Event",
    getSingularName: () => "event",
    getPluralName: () => "events",
    getDisplayName: (entity) => entity.name,
    getFallbackInitials: (entity) => {
      if (!entity.name) return "?";
      return entity.name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
  }
});

// Register Hub entity type
entityRegistry.register({
  type: EntityType.HUB,
  name: "Hub",
  namePlural: "Hubs",
  icon: <Layers className="h-4 w-4" />,
  detailRouteName: APP_ROUTES.HUB_DETAIL,
  convertToEntity: hubToEntity,
  behavior: {
    getDetailUrl: (id) => generatePath(APP_ROUTES.HUB_DETAIL, { hubId: id }),
    getCreateUrl: () => APP_ROUTES.ADMIN_HUBS, // Admins create hubs from the admin page
    getEditUrl: (id) => generatePath(APP_ROUTES.ADMIN_HUBS), // No direct edit page yet
    getListUrl: () => APP_ROUTES.HUBS,
    getIcon: () => <Layers className="h-4 w-4" />,
    getTypeLabel: () => "Hub",
    getSingularName: () => "hub",
    getPluralName: () => "hubs",
    getDisplayName: (entity) => entity.name,
    getFallbackInitials: (entity) => {
      if (!entity.name) return "?";
      return entity.name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
  }
});

// Export a function to initialize all default registrations
export function initializeDefaultEntityRegistrations(): void {
  // This function is intentionally empty as the registrations 
  // happen when the module is imported
  console.log("Default entity types registered");
}

// Register default entity types
export const defaultEntityRegistrations: EntityTypeDefinition[] = [
  {
    type: EntityType.PERSON,
    name: 'Person',
    namePlural: 'People',
    icon: <Users className="h-4 w-4" />,
    detailRouteName: '/profile',
    convertToEntity: profileToEntity,
    label: 'Person',
    pluralLabel: 'People',
    description: 'Community members and professionals',
    baseRoute: '/profile'
  },
  {
    type: EntityType.ORGANIZATION,
    name: 'Organization',
    namePlural: 'Organizations',
    icon: <Building2 className="h-4 w-4" />,
    detailRouteName: '/organizations',
    convertToEntity: organizationToEntity,
    label: 'Organization',
    pluralLabel: 'Organizations',
    description: 'Companies, non-profits, and other groups',
    baseRoute: '/organizations'
  },
  {
    type: EntityType.EVENT,
    name: 'Event',
    namePlural: 'Events',
    icon: <CalendarDays className="h-4 w-4" />,
    detailRouteName: '/events',
    convertToEntity: eventToEntity,
    label: 'Event',
    pluralLabel: 'Events',
    description: 'Meetups, conferences, and gatherings',
    baseRoute: '/events'
  },
  {
    type: EntityType.GUIDE,
    name: 'Guide',
    namePlural: 'Guides',
    icon: <FileCode className="h-4 w-4" />,
    detailRouteName: '/guides',
    convertToEntity: (item) => ({ id: item.id, name: item.title, type: EntityType.GUIDE }),
    label: 'Guide',
    pluralLabel: 'Guides',
    description: 'Educational resources and tutorials',
    baseRoute: '/guides'
  },
  {
    type: EntityType.CHAT,
    name: 'Chat',
    namePlural: 'Chats',
    icon: <MessageSquare className="h-4 w-4" />,
    detailRouteName: '/chat',
    convertToEntity: (item) => ({ id: item.id, name: item.name, type: EntityType.CHAT }),
    label: 'Chat',
    pluralLabel: 'Chats',
    description: 'Conversations and discussions',
    baseRoute: '/chat'
  },
  {
    type: EntityType.HUB,
    name: 'Hub',
    namePlural: 'Hubs',
    icon: <Compass className="h-4 w-4" />,
    detailRouteName: '/hubs',
    convertToEntity: hubToEntity,
    label: 'Hub',
    pluralLabel: 'Hubs',
    description: 'Topic-focused communities',
    baseRoute: '/hubs'
  },
  {
    type: EntityType.POST,
    name: 'Post',
    namePlural: 'Posts',
    icon: <FileText className="h-4 w-4" />,
    detailRouteName: '/feed',
    convertToEntity: (item) => ({ id: item.id, name: item.title || 'Post', type: EntityType.POST }),
    label: 'Post',
    pluralLabel: 'Posts',
    description: 'Community updates and discussions',
    baseRoute: '/feed'
  }
];
