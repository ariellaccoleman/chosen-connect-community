
import React from "react";
import { EntityType } from "../types/entityTypes";
import { entityRegistry } from "./entityRegistry";
import { User, Building, Calendar } from "lucide-react";
import { 
  profileToEntity, 
  organizationToEntity, 
  eventToEntity 
} from "../types/entity";
import { APP_ROUTES } from "@/config/routes";
import { generatePath } from "react-router-dom";

// Register Person entity type
entityRegistry.register({
  type: EntityType.PERSON,
  converter: {
    toEntity: profileToEntity
  },
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
  converter: {
    toEntity: organizationToEntity
  },
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
  converter: {
    toEntity: eventToEntity
  },
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

// Export a function to initialize all default registrations
export function initializeDefaultEntityRegistrations(): void {
  // This function is intentionally empty as the registrations 
  // happen when the module is imported
  console.log("Default entity types registered");
}
