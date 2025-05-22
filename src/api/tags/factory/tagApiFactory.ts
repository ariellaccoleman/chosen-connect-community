
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
export const getAllTags = async (): Promise<Tag[]> => {
  return await tagApi.getAll();
};

export const getTagById = async (id: string): Promise<Tag | null> => {
  return await tagApi.getById(id);
};

export const findTagByName = async (name: string): Promise<Tag | null> => {
  return await tagApi.findByName(name);
};

export const searchTags = async (query: string): Promise<Tag[]> => {
  return await tagApi.searchByName(query);
};

export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  return await tagApi.create(data);
};

export const updateTag = async (id: string, data: Partial<Tag>): Promise<Tag> => {
  return await tagApi.update(id, data);
};

export const deleteTag = async (id: string): Promise<boolean> => {
  return await tagApi.delete(id);
};

export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  return await tagApi.findOrCreate(data, entityType);
};

export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  return await tagApi.getByEntityType(entityType);
};

// For tag assignments
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  return await tagAssignmentApi.getForEntity(entityId, entityType);
};

export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment> => {
  return await tagAssignmentApi.create(tagId, entityId, entityType);
};

export const deleteTagAssignment = async (assignmentId: string): Promise<boolean> => {
  return await tagAssignmentApi.delete(assignmentId);
};
