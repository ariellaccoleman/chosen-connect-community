
import { Tag, TagAssignment } from "@/types";
import { createApiFactory } from "@/api/core/factory/apiFactory";
import { TagWithEntityTypes } from "@/types/tag";
import { extendApiOperations } from "@/api/core/apiExtension";
import { EntityType } from "@/types/entityTypes";

/**
 * Create tag API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
export const createExtendedTagApi = (providedClient?: any) => {
  const baseTagApi = createApiFactory<
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
 * Create tag assignment API with client injection support
 * Now uses lazy client resolution to avoid early instantiation
 */
export const createExtendedTagAssignmentApi = (providedClient?: any) => {
  const baseTagAssignmentApi = createApiFactory<
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
