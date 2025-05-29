import { createApiFactory } from "@/api/core/factory";
import { extendApiOperations } from "@/api/core/apiExtension";
import { Tag, TagAssignment, TagWithEntityTypes } from "@/types";
import { ApiResponse } from "@/api/core/types";
import { getTagsForEntity, assignTagToEntity, removeTagFromEntity, getEntitiesForTag, searchTags, getTagsWithEntityTypes } from "../tagServices";

/**
 * Factory for tag API operations
 */
export const tagApi = createApiFactory<TagWithEntityTypes, string, Partial<Tag>, Partial<Tag>>({
  tableName: 'tags',
  entityName: 'Tag',
  idField: 'id',
  defaultSelect: 'id, name, description, created_by, created_at, updated_at',
  useMutationOperations: true,
  useBatchOperations: false,
  transformResponse: (data) => {
    return {
      ...data,
      entity_types: data.entity_types || []
    };
  }
});

/**
 * Factory for tag assignment API operations
 */
export const tagAssignmentApi = createApiFactory<TagAssignment, string, Partial<TagAssignment>, Partial<TagAssignment>>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
  idField: 'id',
  defaultSelect: 'id, tag_id, target_id, target_type, created_at, updated_at',
  useMutationOperations: true,
  useBatchOperations: false
});

/**
 * Reset tag API with authenticated client
 */
export const resetTagApi = (client?: any) => {
  const newTagApi = createApiFactory<TagWithEntityTypes, string, Partial<Tag>, Partial<Tag>>({
    tableName: 'tags',
    entityName: 'Tag',
    idField: 'id',
    defaultSelect: 'id, name, description, created_by, created_at, updated_at',
    useMutationOperations: true,
    useBatchOperations: false,
    transformResponse: (data) => {
      return {
        ...data,
        entity_types: data.entity_types || []
      };
    }
  }, client);

  const newTagAssignmentApi = createApiFactory<TagAssignment, string, Partial<TagAssignment>, Partial<TagAssignment>>({
    tableName: 'tag_assignments',
    entityName: 'TagAssignment',
    idField: 'id',
    defaultSelect: 'id, tag_id, target_id, target_type, created_at, updated_at',
    useMutationOperations: true,
    useBatchOperations: false
  }, client);

  const newExtendedTagApi = extendApiOperations(newTagApi, {
    getTagsForEntity: async (entityId: string, entityType: string): Promise<ApiResponse<TagWithEntityTypes[]>> => {
      return getTagsForEntity(entityId, entityType, client);
    },
    assignTagToEntity: async (tagId: string, entityId: string, entityType: string): Promise<ApiResponse<TagAssignment>> => {
      return assignTagToEntity(tagId, entityId, entityType, client);
    },
    removeTagFromEntity: async (tagId: string, entityId: string, entityType: string): Promise<ApiResponse<boolean>> => {
      return removeTagFromEntity(tagId, entityId, entityType, client);
    },
    getEntitiesForTag: async (tagId: string, entityType?: string): Promise<ApiResponse<TagAssignment[]>> => {
      return getEntitiesForTag(tagId, entityType, client);
    },
    searchTags: async (query: string, entityType?: string): Promise<ApiResponse<TagWithEntityTypes[]>> => {
      return searchTags(query, entityType, client);
    },
    getTagsWithEntityTypes: async (): Promise<ApiResponse<TagWithEntityTypes[]>> => {
      return getTagsWithEntityTypes(client);
    }
  });

  return {
    getAll: newTagApi.getAll,
    getById: newTagApi.getById,
    getByIds: newTagApi.getByIds,
    create: newTagApi.create,
    update: newTagApi.update,
    delete: newTagApi.delete,
    getTagsForEntity: newExtendedTagApi.getTagsForEntity,
    assignTagToEntity: newExtendedTagApi.assignTagToEntity,
    removeTagFromEntity: newExtendedTagApi.removeTagFromEntity,
    getEntitiesForTag: newExtendedTagApi.getEntitiesForTag,
    searchTags: newExtendedTagApi.searchTags,
    getTagsWithEntityTypes: newExtendedTagApi.getTagsWithEntityTypes
  };
};

// Export specific operations for more granular imports
export const {
  getAll: getAllTags,
  getById: getTagById,
  getByIds: getTagsByIds,
  create: createTag,
  update: updateTag,
  delete: deleteTag
} = tagApi;

// Export tag assignment API operations
export const {
  getAll: getAllTagAssignments,
  getById: getTagAssignmentById,
  getByIds: getTagAssignmentsByIds,
  create: createTagAssignment,
  update: updateTagAssignment,
  delete: deleteTagAssignment
} = tagAssignmentApi;
