
/**
 * Legacy compatibility functions for backward compatibility
 * These functions unwrap the ApiResponse format for legacy consumers
 */
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { tagCoreOperations } from './tagCoreOperations';
import { tagAssignmentCoreOperations } from './tagAssignmentCoreOperations';

// Export individual functions for backward compatibility - these need to unwrap responses
export const getAllTags = async (): Promise<Tag[]> => {
  const response = await tagCoreOperations.getAll();
  return response.data || [];
};

export const getTagById = async (id: string): Promise<Tag | null> => {
  const response = await tagCoreOperations.getById(id);
  return response.data || null;
};

export const findTagByName = async (name: string): Promise<Tag | null> => {
  const response = await tagCoreOperations.findByName(name);
  return response.data || null;
};

export const searchTags = async (searchQuery: string): Promise<Tag[]> => {
  const response = await tagCoreOperations.searchByName(searchQuery);
  return response.data || [];
};

export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  const response = await tagCoreOperations.create(data);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const updateTag = async (id: string, data: Partial<Tag>): Promise<Tag> => {
  const response = await tagCoreOperations.update(id, data);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const deleteTag = async (id: string): Promise<boolean> => {
  const response = await tagCoreOperations.delete(id);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};

export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<Tag> => {
  const response = await tagCoreOperations.findOrCreate(data, entityType);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const getTagsByEntityType = async (entityType: EntityType): Promise<Tag[]> => {
  const response = await tagCoreOperations.getByEntityType(entityType);
  return response.data || [];
};

export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<TagAssignment[]> => {
  const response = await tagAssignmentCoreOperations.getForEntity(entityId, entityType);
  return response.data || [];
};

export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<TagAssignment> => {
  const response = await tagAssignmentCoreOperations.create(tagId, entityId, entityType);
  if (response.error) {
    throw response.error;
  }
  return response.data!;
};

export const deleteTagAssignment = async (assignmentId: string): Promise<boolean> => {
  const response = await tagAssignmentCoreOperations.delete(assignmentId);
  if (response.error) {
    throw response.error;
  }
  return response.data === true;
};
