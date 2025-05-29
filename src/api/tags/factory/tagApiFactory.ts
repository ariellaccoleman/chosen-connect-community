
import { Tag } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { extendApiOperations } from "@/api/core/apiExtension";
import { EntityType } from "@/types/entityTypes";

// Define TagAssignment interface locally to avoid import issues
interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: EntityType;
  created_at: string;
  updated_at: string;
  tag?: Tag;
}

// Define TagWithEntityTypes interface locally
interface TagWithEntityTypes extends Tag {
  entity_types: EntityType[];
  tag_entity_types?: Array<{ entity_type: EntityType }>;
}

/**
 * Create tag API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
const createTagApi = (providedClient?: any) => {
  return createApiFactory<
    TagWithEntityTypes,
    string,
    Partial<Tag>,
    Partial<Tag>
  >({
    tableName: 'tags',
    entityName: 'Tag',
    idField: 'id',
    defaultSelect: `*, tag_entity_types(entity_type)`,
    useMutationOperations: true,
    useBatchOperations: false,
    transformResponse: (data) => {
      return {
        ...data,
        entity_types: data.tag_entity_types?.map((et: any) => et.entity_type) || []
      };
    },
    transformRequest: (data) => {
      const cleanedData: Record<string, any> = { ...data };
      delete cleanedData.entity_types;
      delete cleanedData.tag_entity_types;
      
      if (!cleanedData.updated_at) {
        cleanedData.updated_at = new Date().toISOString();
      }
      
      return cleanedData;
    }
  }, providedClient);
};

/**
 * Create tag assignment API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
const createTagAssignmentApi = (providedClient?: any) => {
  return createApiFactory<
    TagAssignment,
    string,
    Partial<TagAssignment>,
    Partial<TagAssignment>
  >({
    tableName: 'tag_assignments',
    entityName: 'TagAssignment',
    idField: 'id',
    defaultSelect: `*`,
    useMutationOperations: true,
    useBatchOperations: false,
    transformRequest: (data) => {
      const cleanedData: Record<string, any> = { ...data };
      
      if (!cleanedData.updated_at) {
        cleanedData.updated_at = new Date().toISOString();
      }
      
      return cleanedData;
    }
  }, providedClient);
};

/**
 * Create extended tag API with business operations
 */
export const createExtendedTagApi = (providedClient?: any) => {
  const baseTagApi = createTagApi(providedClient);

  // Extended operations using the API extension pattern
  return extendApiOperations(baseTagApi, {
    findOrCreate: async (tagData: Partial<Tag> & { entity_type?: EntityType }) => {
      const { entity_type, ...cleanTagData } = tagData;
      
      // Search for existing tag
      const existingResponse = await baseTagApi.getAll({ 
        filters: { name: cleanTagData.name } 
      });
      
      if (existingResponse.error) {
        return existingResponse;
      }
      
      if (existingResponse.data && existingResponse.data.length > 0) {
        return {
          data: existingResponse.data[0],
          error: null
        };
      }
      
      // Create new tag if not found
      return baseTagApi.create(cleanTagData as any);
    },

    searchByName: async (searchTerm: string) => {
      return baseTagApi.getAll({
        filters: {
          name: `%${searchTerm}%`
        }
      });
    }
  });
};

/**
 * Create extended tag assignment API with business operations
 */
export const createExtendedTagAssignmentApi = (providedClient?: any) => {
  const baseTagAssignmentApi = createTagAssignmentApi(providedClient);

  // Extended operations using the API extension pattern
  return extendApiOperations(baseTagAssignmentApi, {
    createAssignment: async (tagId: string, targetId: string, targetType: EntityType) => {
      return baseTagAssignmentApi.create({
        tag_id: tagId,
        target_id: targetId,
        target_type: targetType
      } as any);
    },

    getEntitiesByTagId: async (tagId: string, entityType: EntityType) => {
      return baseTagAssignmentApi.getAll({
        filters: {
          tag_id: tagId,
          target_type: entityType
        }
      });
    }
  });
};

// For backward compatibility - these will be lazy-loaded
let _tagApiInstance: any = null;
let _tagAssignmentApiInstance: any = null;

/**
 * Lazy-loaded tag API instance
 * Only created when first accessed to avoid early instantiation
 */
export const tagApi = new Proxy({} as any, {
  get(target, prop) {
    if (!_tagApiInstance) {
      _tagApiInstance = createExtendedTagApi();
    }
    return _tagApiInstance[prop];
  }
});

/**
 * Lazy-loaded tag assignment API instance
 * Only created when first accessed to avoid early instantiation
 */
export const tagAssignmentApi = new Proxy({} as any, {
  get(target, prop) {
    if (!_tagAssignmentApiInstance) {
      _tagAssignmentApiInstance = createExtendedTagAssignmentApi();
    }
    return _tagAssignmentApiInstance[prop];
  }
});

// Export specific operations for more granular imports - these will also be lazy
export const getAllTags = (...args: any[]) => tagApi.getAll(...args);
export const getTagById = (...args: any[]) => tagApi.getById(...args);
export const getTagsByIds = (...args: any[]) => tagApi.getByIds(...args);
export const createTag = (...args: any[]) => tagApi.create(...args);
export const updateTag = (...args: any[]) => tagApi.update(...args);
export const deleteTag = (...args: any[]) => tagApi.delete(...args);
export const findTagByName = (...args: any[]) => tagApi.searchByName(...args);
export const searchTags = (...args: any[]) => tagApi.searchByName(...args);
export const findOrCreateTag = (...args: any[]) => tagApi.findOrCreate(...args);
export const getTagsByEntityType = (...args: any[]) => tagApi.getAll(...args);

export const getTagAssignmentsForEntity = (...args: any[]) => tagAssignmentApi.getAll(...args);
export const createTagAssignment = (...args: any[]) => tagAssignmentApi.createAssignment(...args);
export const deleteTagAssignment = (...args: any[]) => tagAssignmentApi.delete(...args);

// Export factory functions
export const createTagApiFactory = createTagApi;
export const createTagAssignmentApiFactory = createTagAssignmentApi;
