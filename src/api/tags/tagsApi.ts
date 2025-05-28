
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { extendedTagApi, tagAssignmentApi } from './factory/tagApiFactory';

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  return await extendedTagApi.getAll();
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: string): Promise<Tag | null> => {
  return await extendedTagApi.getById(id);
};

/**
 * Find tag by name
 */
export const findTagByName = async (name: string): Promise<Tag | null> => {
  return await extendedTagApi.findByName(name);
};

/**
 * Create a new tag
 */
export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  return await extendedTagApi.create(data);
};

/**
 * Update an existing tag
 */
export const updateTag = async (id: string, data: Partial<Tag>): Promise<Tag> => {
  return await extendedTagApi.update(id, data);
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<boolean> => {
  return await extendedTagApi.delete(id);
};

/**
 * Find or create a tag
 */
export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  return await extendedTagApi.findOrCreate(data, entityType);
};

/**
 * Get tags by entity type
 */
export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  return await extendedTagApi.getByEntityType(entityType);
};

/**
 * Get tag assignments for an entity
 */
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  return await tagAssignmentApi.getForEntity(entityId, entityType);
};

/**
 * Create a tag assignment
 */
export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment> => {
  return await tagAssignmentApi.create(tagId, entityId, entityType);
};

/**
 * Delete a tag assignment
 */
export const deleteTagAssignment = async (assignmentId: string): Promise<boolean> => {
  return await tagAssignmentApi.delete(assignmentId);
};
