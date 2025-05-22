
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag, TagAssignment, TagEntityType } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createTagRepository } from '../repository';
import { TagRepository } from '../repository/TagRepository';

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
 * Create specialized API operations for tags
 */
export function createTagApiFactory<T extends Tag>(options: TagApiOptions = {}): TagOperations<T> {
  // Set up default options
  const tableName = options.tableName || 'tags';
  const repositoryType = options.repositoryType || 'supabase';
  const defaultEntityType = options.defaultEntityType;
  
  // Create tag repository
  const repository = createTagRepository() as TagRepository;
  
  // Create core API operations using the standard factory
  const coreApi = createApiFactory<Tag, string, Partial<Tag>, Partial<Tag>>({
    tableName: tableName as any,
    entityName: 'tag',
    defaultOrderBy: 'name',
    transformResponse: (data) => ({
      id: data.id,
      name: data.name,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by
    }),
    transformRequest: (data) => {
      const transformed: Record<string, any> = {};
      if (data.name !== undefined) transformed.name = data.name;
      if (data.description !== undefined) transformed.description = data.description;
      if (data.created_by !== undefined) transformed.created_by = data.created_by;
      return transformed;
    },
    useMutationOperations: true,
    useQueryOperations: true
  });

  // Return combined operations
  return {
    // Core operations from standard factory
    getById: async (id: string) => {
      const response = await repository.getTagById(id);
      return response.data as T | null;
    },
    
    getAll: async () => {
      const response = await repository.getAllTags();
      return response.data as T[];
    },
    
    create: async (data: Partial<T>) => {
      const response = await repository.createTag(data);
      return response.data as T;
    },
    
    update: async (id: string, data: Partial<T>) => {
      const response = await repository.updateTag(id, data);
      return response.data as T;
    },
    
    delete: async (id: string) => {
      const response = await repository.deleteTag(id);
      return response.data as boolean;
    },
    
    // Custom tag-specific operations
    findByName: async (name: string) => {
      const response = await repository.findTagByName(name);
      return response.data as T | null;
    },
    
    getByEntityType: async (entityType: EntityType) => {
      const response = await repository.getTagsByEntityType(entityType);
      return response.data as T[];
    },
    
    findOrCreate: async (data: Partial<T>, entityType?: EntityType) => {
      // Use the provided entity type or fall back to the default
      const effectiveEntityType = entityType || defaultEntityType;
      
      if (!data.name) {
        throw new Error("Tag name is required for findOrCreate operation");
      }
      
      // First try to find the tag by name
      const existingTag = await repository.findTagByName(data.name);
      
      if (existingTag.data) {
        return existingTag.data as T;
      }
      
      // If not found, create the tag
      const newTag = await repository.createTag(data);
      
      // Associate with entity type if specified
      if (effectiveEntityType) {
        try {
          await this.associateWithEntityType(newTag.data.id, effectiveEntityType);
        } catch (err) {
          // Log but don't fail if entity type association fails
          console.warn(`Failed to associate new tag with entity type: ${err}`);
        }
      }
      
      return newTag.data as T;
    },
    
    associateWithEntityType: async (tagId: string, entityType: EntityType) => {
      // This operation requires the tag entity type repository
      const { createTagEntityTypeRepository } = await import('../repository');
      const tagEntityTypeRepo = createTagEntityTypeRepository();
      
      try {
        await tagEntityTypeRepo.associateTagWithEntityType(tagId, entityType);
        return true;
      } catch (err) {
        console.error(`Error associating tag ${tagId} with entity type ${entityType}:`, err);
        return false;
      }
    }
  };
}

/**
 * Create tag assignment API factory
 */
export function createTagAssignmentApiFactory(options: TagApiOptions = {}) {
  // Implementation for tag assignments operations
  const { createTagAssignmentRepository } = require('../repository');
  const tagAssignmentRepo = createTagAssignmentRepository();
  
  return {
    // Get assignments for entity
    getForEntity: async (entityId: string, entityType: EntityType) => {
      return tagAssignmentRepo.getTagAssignmentsForEntity(entityId, entityType);
    },
    
    // Create assignment
    create: async (tagId: string, entityId: string, entityType: EntityType) => {
      return tagAssignmentRepo.createTagAssignment({
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      });
    },
    
    // Delete assignment
    delete: async (assignmentId: string) => {
      await tagAssignmentRepo.deleteTagAssignment(assignmentId);
      return true;
    },
    
    // Delete all assignments for an entity
    deleteForEntity: async (entityId: string, entityType: EntityType) => {
      await tagAssignmentRepo.deleteTagAssignmentsForEntity(entityId, entityType);
      return true;
    }
  };
}

/**
 * Create a default tag API instance
 */
export const tagApi = createTagApiFactory();

/**
 * Create a default tag assignment API instance
 */
export const tagAssignmentApi = createTagAssignmentApiFactory();
