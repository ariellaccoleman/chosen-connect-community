
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createTagRepository } from '../repository';
import { TagRepository } from '../repository/TagRepository';
import { TagApiOptions, TagOperations } from './types';

/**
 * Create specialized API operations for tags
 */
export function createTagOperations<T extends Tag>(options: TagApiOptions = {}): TagOperations<T> {
  // Set up default options
  const tableName = options.tableName || 'tags';
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
      return response as unknown as T | null;
    },
    
    getAll: async () => {
      const response = await repository.getAllTags();
      return response as unknown as T[];
    },
    
    create: async (data: Partial<T>) => {
      const response = await repository.createTag(data);
      return response as unknown as T;
    },
    
    update: async (id: string, data: Partial<T>) => {
      const response = await repository.updateTag(id, data);
      return response as unknown as T;
    },
    
    delete: async (id: string) => {
      const response = await repository.deleteTag(id);
      return response as unknown as boolean;
    },
    
    // Custom tag-specific operations
    findByName: async (name: string) => {
      const response = await repository.findTagByName(name);
      return response as unknown as T | null;
    },
    
    getByEntityType: async (entityType: EntityType) => {
      const response = await repository.getTagsByEntityType(entityType);
      return response as unknown as T[];
    },
    
    findOrCreate: async (data: Partial<T>, entityType?: EntityType) => {
      // Use the provided entity type or fall back to the default
      const effectiveEntityType = entityType || defaultEntityType;
      
      if (!data.name) {
        throw new Error("Tag name is required for findOrCreate operation");
      }
      
      // First try to find the tag by name
      const existingTag = await repository.findTagByName(data.name);
      
      if (existingTag) {
        return existingTag as unknown as T;
      }
      
      // If not found, create the tag
      const newTag = await repository.createTag(data);
      
      // Associate with entity type if specified - fix: access the data.id property
      if (effectiveEntityType && newTag && newTag.data && newTag.data.id) {
        try {
          await repository.associateTagWithEntityType(newTag.data.id, effectiveEntityType);
        } catch (err) {
          // Log but don't fail if entity type association fails
          console.warn(`Failed to associate new tag with entity type: ${err}`);
        }
      }
      
      return newTag as unknown as T;
    },
    
    associateWithEntityType: async (tagId: string, entityType: EntityType) => {
      try {
        await repository.associateTagWithEntityType(tagId, entityType);
        return true;
      } catch (err) {
        console.error(`Error associating tag ${tagId} with entity type ${entityType}:`, err);
        return false;
      }
    }
  };
}
