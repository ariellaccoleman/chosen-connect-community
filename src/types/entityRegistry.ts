
import { EntityType } from "./entityTypes";
import { Entity } from "./entity";
import { ReactNode } from "react";

// Entity converter definition
export interface EntityConverter<T> {
  toEntity: (source: T) => Entity;
  fromEntity?: (entity: Entity) => Partial<T>;
}

// Entity behavior interface
export interface EntityBehavior {
  // URL generation
  getDetailUrl: (id: string) => string;
  getCreateUrl: () => string;
  getEditUrl: (id: string) => string;
  getListUrl: () => string;
  
  // UI elements
  getIcon: () => ReactNode;
  getAvatar?: (entity: Entity) => ReactNode;
  getFallbackInitials: (entity: Entity) => string;
  
  // Display formatting
  getTypeLabel: () => string;
  getSingularName: () => string;
  getPluralName: () => string;
  getDisplayName: (entity: Entity) => string;
  formatSummary?: (entity: Entity) => string;
  
  // Search/filter methods
  getSearchableFields?: () => string[];
  getFilterableFields?: () => string[];
}

// Main EntityTypeDefinition that combines type information with behavior
export interface EntityTypeDefinition {
  type: EntityType;
  converter: EntityConverter<any>;
  behavior: EntityBehavior;
}

// Entity registration format used for the default registrations
export interface EntityRegistration {
  type: EntityType;
  icon: ReactNode;
  label: string;
  pluralLabel?: string;
  avatarFallback: (name: string | undefined) => string;
  defaultRoute: string;
}
