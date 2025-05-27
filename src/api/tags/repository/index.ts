
import { TagRepository } from './TagRepository';
import { TagAssignmentRepository } from './TagAssignmentRepository';
import { TagEntityTypeRepository } from './TagEntityTypeRepository';

/**
 * Create a tag repository instance
 */
export function createTagRepository(providedClient?: any): TagRepository {
  return new TagRepository(providedClient);
}

/**
 * Create a tag assignment repository instance
 */
export function createTagAssignmentRepository(providedClient?: any): TagAssignmentRepository {
  return new TagAssignmentRepository(providedClient);
}

/**
 * Create a tag entity type repository instance
 */
export function createTagEntityTypeRepository(providedClient?: any): TagEntityTypeRepository {
  return new TagEntityTypeRepository(providedClient);
}
