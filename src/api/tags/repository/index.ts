
import { createTagRepository } from './TagRepository';
import { createTagAssignmentRepository } from './TagAssignmentRepository';
import { createTagEntityTypeRepository } from './TagEntityTypeRepository';

// Export the repository creation functions
export { createTagRepository } from './TagRepository';
export { createTagAssignmentRepository } from './TagAssignmentRepository';
export { createTagEntityTypeRepository } from './TagEntityTypeRepository';

// Export the repository interfaces/types for service usage
export type { TagRepository } from './TagRepository';
export type { TagAssignmentRepository } from './TagAssignmentRepository';  
export type { TagEntityTypeRepository } from './TagEntityTypeRepository';

/**
 * Create a tag repository instance
 */
export function createTagRepositoryInstance(providedClient?: any) {
  return createTagRepository(providedClient);
}

/**
 * Create a tag assignment repository instance
 */
export function createTagAssignmentRepositoryInstance(providedClient?: any) {
  return createTagAssignmentRepository(providedClient);
}

/**
 * Create a tag entity type repository instance
 */
export function createTagEntityTypeRepositoryInstance(providedClient?: any) {
  return createTagEntityTypeRepository(providedClient);
}
