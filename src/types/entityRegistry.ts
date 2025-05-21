
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
