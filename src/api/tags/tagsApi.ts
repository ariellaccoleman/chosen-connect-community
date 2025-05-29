
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { tagApi, tagAssignmentApi } from './factory/tagApiFactory';

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  const response = await tagApi.getAll();
  if (response.error) {
    throw response.error;
  }
  return response.data || [];
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: string): Promise<Tag | null> => {
  const response = await tagApi.getById(id);
  if (response.error) {
    throw response.error;
  }
  return response.data || null;
};

/**
 * Find tag by name
 */
export const findTagByName = async (name: string): Promise<Tag | null> => {
  const response = await tagApi.getAll({ filters: { name } });
  if (response.error) {
    throw response.error;
  }
  return response.data?.[0] || null;
};

/**
 * Create a new tag
 */
export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  const response = await tagApi.create(data);
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('Failed to create tag');
  }
  return response.data;
};

/**
 * Update an existing tag
 */
export const updateTag = async (id: string, data: Partial<Tag>): Promise<Tag> => {
  const response = await tagApi.update(id, data);
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('Failed to update tag');
  }
  return response.data;
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<boolean> => {
  const response = await tagApi.delete(id);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};

/**
 * Find or create a tag
 */
export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  const response = await tagApi.findOrCreate(data, entityType);
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('Failed to find or create tag');
  }
  return response.data;
};

/**
 * Get tags by entity type
 */
export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  const response = await tagApi.getByEntityType(entityType);
  if (response.error) {
    throw response.error;
  }
  return response.data || [];
};

/**
 * Get tag assignments for an entity
 */
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  const response = await tagAssignmentApi.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });
  if (response.error) {
    throw response.error;
  }
  return response.data || [];
};

/**
 * Create a tag assignment
 */
export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment> => {
  const response = await tagAssignmentApi.create(tagId, entityId, entityType);
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('Failed to create tag assignment');
  }
  return response.data;
};

/**
 * Delete a tag assignment
 */
export const deleteTagAssignment = async (assignmentId: string): Promise<boolean> => {
  const response = await tagAssignmentApi.delete(assignmentId);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};
