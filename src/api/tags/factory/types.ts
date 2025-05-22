
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';

/**
 * Options for creating tag API operations
 */
export interface TagApiOptions {
  /**
   * Table name for the repository
   * @default 'tags'
   */
  tableName?: string;
  
  /**
   * Repository type (supabase, mock)
   * @default 'supabase'
   */
  repositoryType?: 'supabase' | 'mock';
  
  /**
   * Initial data for mock repository
   */
  initialData?: Tag[];
  
  /**
   * Default entity type for created tags
   */
  defaultEntityType?: EntityType;
}

/**
 * Extended tag operations for tag-specific functionality
 */
export interface TagOperations<T = Tag> {
  /**
   * Find a tag by name
   */
  findByName: (name: string) => Promise<T | null>;
  
  /**
   * Get tags by entity type
   */
  getByEntityType: (entityType: EntityType) => Promise<T[]>;
  
  /**
   * Find or create a tag
   */
  findOrCreate: (data: Partial<T>, entityType?: EntityType) => Promise<T>;
  
  /**
   * Associate a tag with an entity type
   */
  associateWithEntityType: (tagId: string, entityType: EntityType) => Promise<boolean>;
  
  // Include standard API operations
  getById: (id: string) => Promise<T | null>;
  getAll: () => Promise<T[]>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
}

/**
 * Interface for tag assignment operations
 */
export interface TagAssignmentOperations {
  /**
   * Get assignments for entity
   */
  getForEntity: (entityId: string, entityType: EntityType) => Promise<TagAssignment[]>;
  
  /**
   * Create assignment
   */
  create: (tagId: string, entityId: string, entityType: EntityType) => Promise<TagAssignment>;
  
  /**
   * Delete assignment
   */
  delete: (assignmentId: string) => Promise<boolean>;
  
  /**
   * Delete all assignments for an entity
   */
  deleteForEntity: (entityId: string, entityType: EntityType) => Promise<boolean>;
}
