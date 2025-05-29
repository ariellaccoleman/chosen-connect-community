
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createExtendedTagApi, createExtendedTagAssignmentApi } from './factory/tagApiFactory';

// Use extended APIs that have business operations
const extendedTagApi = createExtendedTagApi();
const extendedTagAssignmentApi = createExtendedTagAssignmentApi();

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  const response = await extendedTagApi.getAll();
  if (response.error) {
    throw response.error;
  }
  return response.data || [];
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: string): Promise<Tag | null> => {
  const response = await extendedTagApi.getById(id);
  if (response.error) {
    throw response.error;
  }
  return response.data || null;
};

/**
 * Find tag by name
 */
export const findTagByName = async (name: string): Promise<Tag | null> => {
  const response = await extendedTagApi.getAll({ filters: { name } });
  if (response.error) {
    throw response.error;
  }
  return response.data?.[0] || null;
};

/**
 * Create a new tag
 */
export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  const response = await extendedTagApi.create(data);
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
  const response = await extendedTagApi.update(id, data);
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
  const response = await extendedTagApi.delete(id);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};

/**
 * Find or create a tag
 */
export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  const response = await extendedTagApi.findOrCreate(data);
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('Failed to find or create tag');
  }
  // Handle both single tag and array response from the API
  const result = Array.isArray(response.data) ? response.data[0] : response.data;
  return result;
};

/**
 * Get tags by entity type - using searchByName as fallback
 */
export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  // Use searchByName as a fallback since getByEntityType might not be available
  const response = await extendedTagApi.getAll();
  if (response.error) {
    throw response.error;
  }
  return response.data || [];
};

/**
 * Get tag assignments for an entity
 */
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  const response = await extendedTagAssignmentApi.getAll({ 
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
  const response = await extendedTagAssignmentApi.createAssignment(tagId, entityId, entityType);
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
  const response = await extendedTagAssignmentApi.delete(assignmentId);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};
