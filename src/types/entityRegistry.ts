
import { ReactNode } from 'react';
import { EntityType } from './entityTypes';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: any;
  // Legacy property names
  entityType?: EntityType;
  tags?: string[];
  location?: any;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
  [key: string]: any;
}

export interface EntityBase {
  id: string;
  [key: string]: any;
}

export interface EntityTypeDefinition {
  type: EntityType;
  name: string;
  namePlural: string;
  icon: ReactNode;
  detailRouteName: string;
  convertToEntity: (item: any) => Entity;
  isEnabled?: boolean;
  sortOrder?: number;
  // Add properties used in defaultEntityRegistrations
  label?: string;
  pluralLabel?: string;
  description?: string;
  baseRoute?: string;
  converter?: {
    toEntity: (item: any) => Entity;
  };
  behavior?: {
    getDetailUrl: (id: string) => string;
    getCreateUrl: () => string;
    getEditUrl: (id: string) => string;
    getListUrl: () => string;
    getIcon: () => ReactNode;
    getTypeLabel: () => string;
    getSingularName: () => string;
    getPluralName: () => string;
    getDisplayName: (entity: Entity) => string;
    getFallbackInitials: (entity: Entity) => string;
  };
}

export interface EntityRegistry {
  registerEntityType: (definition: EntityTypeDefinition) => void;
  getEntityTypes: () => EntityTypeDefinition[];
  getEnabledEntityTypes: () => EntityTypeDefinition[];
  getEntityTypeByType: (type: EntityType) => EntityTypeDefinition | undefined;
  getEntityTypeLabel: (type: EntityType) => string;
  getEntityTypePlural: (type: EntityType) => string;
  getEntityTypeIcon: (type: EntityType) => ReactNode;
  getEntityTypeRoute: (type: EntityType) => string;
  toEntity: (item: any, type: EntityType) => Entity;
}
