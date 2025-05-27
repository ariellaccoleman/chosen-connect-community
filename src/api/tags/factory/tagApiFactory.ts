
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { TagApiOptions, TagOperations, TagAssignmentOperations } from './types';
import { createTagOperations } from './tagOperations';
import { createTagAssignmentOperations } from './tagAssignmentOperations';

/**
 * Create specialized API operations for tags
 */
export function createTagApiFactory<T extends Tag>(options: TagApiOptions = {}): TagOperations<T> {
  return createTagOperations<T>(options);
}

/**
 * Create tag assignment API factory
 */
export function createTagAssignmentApiFactory(options: TagApiOptions = {}): TagAssignmentOperations {
  return createTagAssignmentOperations(options);
}

// Create a default tag API instance
export const tagApi = createTagApiFactory();

// Create a default tag assignment API instance
export const tagAssignmentApi = createTagAssignmentApiFactory();

// Export standard functions that match the original API
export const getAllTags = async (providedClient?: any): Promise<Tag[]> => {
  return await tagApi.getAll(providedClient);
};

export const getTagById = async (id: string, providedClient?: any): Promise<Tag | null> => {
  return await tagApi.getById(id, providedClient);
};

export const findTagByName = async (name: string, providedClient?: any): Promise<Tag | null> => {
  return await tagApi.findByName(name, providedClient);
};

export const searchTags = async (query: string, providedClient?: any): Promise<Tag[]> => {
  return await tagApi.searchByName(query, providedClient);
};

export const createTag = async (data: Partial<Tag>, providedClient?: any): Promise<Tag> => {
  return await tagApi.create(data, providedClient);
};

export const updateTag = async (id: string, data: Partial<Tag>, providedClient?: any): Promise<Tag> => {
  return await tagApi.update(id, data, providedClient);
};

export const deleteTag = async (id: string, providedClient?: any): Promise<boolean> => {
  return await tagApi.delete(id, providedClient);
};

export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType, providedClient?: any): Promise<Tag> => {
  return await tagApi.findOrCreate(data, entityType, providedClient);
};

export const getTagsByEntityType = async (entityType: EntityType, providedClient?: any): Promise<Tag[]> => {
  return await tagApi.getByEntityType(entityType, providedClient);
};

// For tag assignments
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType, providedClient?: any): Promise<TagAssignment[]> => {
  return await tagAssignmentApi.getForEntity(entityId, entityType, providedClient);
};

export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType, providedClient?: any): Promise<TagAssignment> => {
  return await tagAssignmentApi.create(tagId, entityId, entityType, providedClient);
};

export const deleteTagAssignment = async (assignmentId: string, providedClient?: any): Promise<boolean> => {
  return await tagAssignmentApi.delete(assignmentId, providedClient);
};
