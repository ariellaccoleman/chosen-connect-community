
/**
 * Tag assignment operations using the API factory pattern
 */
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { ApiResponse } from '@/api/core/errorHandler';

// Create tag assignment API using the factory pattern
const tagAssignmentBase = createApiFactory<TagAssignment>({
  tableName: 'tag_assignments',
  entityName: 'TagAssignment',
  useQueryOperations: true,
  useMutationOperations: true,
  defaultSelect: '*',
  transformResponse: (item: any): TagAssignment => ({
    id: item.id,
    tag_id: item.tag_id,
    target_id: item.target_id,
    target_type: item.target_type,
    created_at: item.created_at,
    updated_at: item.updated_at
  })
});

// Extended operations for tag assignment specific logic
export const tagAssignmentCoreOperations = {
  ...tagAssignmentBase,
  
  async create(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>> {
    return tagAssignmentBase.create({
      tag_id: tagId,
      target_id: entityId,
      target_type: entityType
    });
  },
  
  async getForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    return tagAssignmentBase.getAll({
      filters: {
        target_id: entityId,
        target_type: entityType
      }
    });
  },
  
  async getEntitiesByTagId(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>> {
    const filters: any = { tag_id: tagId };
    if (entityType) {
      filters.target_type = entityType;
    }
    
    return tagAssignmentBase.getAll({ filters });
  }
};
