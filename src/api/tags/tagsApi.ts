
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createExtendedTagApi, createExtendedTagAssignmentApi } from './factory/tagApiFactory';
import { ApiResponse } from '@/api/core/errorHandler';

// Use extended APIs that have business operations
const extendedTagApi = createExtendedTagApi();
const extendedTagAssignmentApi = createExtendedTagAssignmentApi();

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<ApiResponse<Tag[]>> => {
  const response = await extendedTagApi.getAll();
  return response;
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: string): Promise<ApiResponse<Tag | null>> => {
  const response = await extendedTagApi.getById(id);
  return response;
};

/**
 * Find tag by name
 */
export const findTagByName = async (name: string): Promise<ApiResponse<Tag | null>> => {
  const response = await extendedTagApi.getAll({ filters: { name } });
  if (response.error) {
    return response as ApiResponse<Tag | null>;
  }
  
  const tag = response.data?.[0] || null;
  return {
    data: tag,
    error: null,
    status: 'success',
    isSuccess: () => true,
    isError: () => false
  };
};

/**
 * Create a new tag
 */
export const createTag = async (data: Partial<Tag>): Promise<ApiResponse<Tag>> => {
  const response = await extendedTagApi.create(data);
  return response;
};

/**
 * Update an existing tag
 */
export const updateTag = async (id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>> => {
  const response = await extendedTagApi.update(id, data);
  return response;
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<ApiResponse<boolean>> => {
  const response = await extendedTagApi.delete(id);
  if (response.error) {
    return response as ApiResponse<boolean>;
  }
  
  return {
    data: response.data === true,
    error: null,
    status: 'success',
    isSuccess: () => true,
    isError: () => false
  };
};

/**
 * Find or create a tag
 */
export const findOrCreateTag = async (data: Partial<Tag>, entityType?: EntityType): Promise<ApiResponse<Tag>> => {
  const response = await extendedTagApi.findOrCreate(data);
  return response;
};

/**
 * Get tags by entity type
 */
export const getTagsByEntityType = async (entityType: EntityType): Promise<ApiResponse<Tag[]>> => {
  const response = await extendedTagApi.getByEntityType(entityType);
  return response;
};

/**
 * Get tag assignments for an entity
 */
export const getTagAssignmentsForEntity = async (entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>> => {
  const response = await extendedTagAssignmentApi.getAll({ 
    filters: { 
      target_id: entityId, 
      target_type: entityType 
    } 
  });
  return response;
};

/**
 * Create a tag assignment
 */
export const createTagAssignment = async (tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>> => {
  const response = await extendedTagAssignmentApi.createAssignment(tagId, entityId, entityType);
  return response;
};

/**
 * Delete a tag assignment
 */
export const deleteTagAssignment = async (assignmentId: string): Promise<ApiResponse<boolean>> => {
  const response = await extendedTagAssignmentApi.delete(assignmentId);
  if (response.error) {
    return response as ApiResponse<boolean>;
  }
  
  return {
    data: response.data === true,
    error: null,
    status: 'success',
    isSuccess: () => true,
    isError: () => false
  };
};
