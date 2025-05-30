
/**
 * Main tag API exports - Factory pattern only
 */

// Export the factory APIs and their instances
export {
  tagApi,
  tagAssignmentApi,
  createTagApiFactory,
  createTagAssignmentApiFactory,
  createExtendedTagApi,
  createExtendedTagAssignmentApi
} from './factory/tagApiFactory';

// Import API instances for function exports
import { tagApi, tagAssignmentApi } from './factory/tagApiFactory';
import { EntityType } from '@/types/entityTypes';

// Export simplified function interface using the API instances
export const createTag = (data: any) => tagApi.create(data);
export const updateTag = (id: string, data: any) => tagApi.update(id, data);
export const deleteTag = (id: string) => tagApi.delete(id);
export const findOrCreateTag = (name: string) => tagApi.findOrCreate(name);
export const createTagAssignment = (tagId: string, entityId: string, entityType: EntityType) => 
  tagAssignmentApi.createAssignment(tagId, entityId, entityType);
export const deleteTagAssignment = (id: string) => tagAssignmentApi.delete(id);
