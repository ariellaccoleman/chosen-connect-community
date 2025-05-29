
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/types';

// Re-export TagAssignment for this module
export type { TagAssignment } from '@/utils/tags/types';

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
  getAll(providedClient?: any): Promise<T[]>;
  
  /**
   * Get tag by ID
   */
  getById(id: string, providedClient?: any): Promise<T | null>;
  
  /**
   * Find tag by name
   */
  findByName(name: string, providedClient?: any): Promise<T | null>;

  /**
   * Search tags by name (partial match)
   */
  searchByName(query: string, providedClient?: any): Promise<T[]>;
  
  /**
   * Create a new tag
   */
  create(data: Partial<T>, providedClient?: any): Promise<T>;
  
  /**
   * Update a tag
   */
  update(id: string, data: Partial<T>, providedClient?: any): Promise<T>;
  
  /**
   * Delete a tag
   */
  delete(id: string, providedClient?: any): Promise<boolean>;
  
  /**
   * Find or create a tag by name
   */
  findOrCreate(data: Partial<T>, entityType?: EntityType, providedClient?: any): Promise<T>;
  
  /**
   * Get tags by entity type
   */
  getByEntityType(entityType: EntityType, providedClient?: any): Promise<T[]>;
}

/**
 * Core operations for tag assignment entities
 */
export interface TagAssignmentOperations {
  /**
   * Get tag assignments for an entity
   */
  getForEntity(entityId: string, entityType: EntityType, providedClient?: any): Promise<TagAssignment[]>;
  
  /**
   * Get entities by tag ID
   */
  getEntitiesByTagId(tagId: string, entityType?: EntityType, providedClient?: any): Promise<TagAssignment[]>;
  
  /**
   * Create a tag assignment
   */
  create(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<TagAssignment>;
  
  /**
   * Delete a tag assignment by ID
   */
  delete(assignmentId: string, providedClient?: any): Promise<boolean>;
  
  /**
   * Delete tag assignment by tag and entity
   */
  deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<boolean>;

  /**
   * Delete all tag assignments for an entity
   */
  deleteForEntity(entityId: string, entityType: EntityType, providedClient?: any): Promise<boolean>;
  
  /**
   * Check if a tag is assigned to an entity
   */
  isTagAssigned(tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<boolean>;
}
