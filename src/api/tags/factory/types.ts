import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/types';

/**
 * Options for configuring the tag API
 */
export interface TagApiOptions {
  /**
   * Enable caching for tag queries
   */
  enableCache?: boolean;
  
  /**
   * Cache expiration time in seconds
   */
  cacheExpirationSeconds?: number;
  
  /**
   * Custom table name (defaults to 'tags')
   */
  tableName?: string;
}

/**
 * Core operations for tag entities
 */
export interface TagOperations<T extends Tag = Tag> {
  /**
   * Get all tags
   */
  getAll(): Promise<T[]>;
  
  /**
   * Get tag by ID
   */
  getById(id: string): Promise<T | null>;
  
  /**
   * Find tag by name
   */
  findByName(name: string): Promise<T | null>;

  /**
   * Search tags by name (partial match)
   */
  searchByName(query: string): Promise<T[]>;
  
  /**
   * Create a new tag
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update a tag
   */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete a tag
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find or create a tag by name
   */
  findOrCreate(data: Partial<T>, entityType?: EntityType): Promise<T>;
  
  /**
   * Get tags by entity type
   */
  getByEntityType(entityType: EntityType): Promise<T[]>;
}

/**
 * Core operations for tag assignment entities
 */
export interface TagAssignmentOperations {
  /**
   * Get tag assignments for an entity
   */
  getForEntity(entityId: string, entityType: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Get entities by tag ID
   */
  getEntitiesByTagId(tagId: string, entityType?: EntityType): Promise<TagAssignment[]>;
  
  /**
   * Create a tag assignment
   */
  create(tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment>;
  
  /**
   * Delete a tag assignment by ID
   */
  delete(assignmentId: string): Promise<boolean>;
  
  /**
   * Delete tag assignment by tag and entity
   */
  deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType): Promise<boolean>;

  /**
   * Delete all tag assignments for an entity
   */
  deleteForEntity(entityId: string, entityType: EntityType): Promise<boolean>;
  
  /**
   * Check if a tag is assigned to an entity
   */
  isTagAssigned(tagId: string, entityId: string, entityType: EntityType): Promise<boolean>;
}
