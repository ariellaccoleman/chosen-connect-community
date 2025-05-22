
/**
 * Tag Repositories Export Module
 * Exports all tag-related repository classes and factory functions
 */

// Export the repositories
export * from './TagRepository';
export * from './TagAssignmentRepository';
export * from './TagEntityTypeRepository';

// Export a factory function that creates all repositories
import { createTagRepository, TagRepository } from './TagRepository';
import { createTagAssignmentRepository, TagAssignmentRepository } from './TagAssignmentRepository';
import { createTagEntityTypeRepository, TagEntityTypeRepository } from './TagEntityTypeRepository';

/**
 * Repository bundle containing all tag-related repositories
 */
export interface TagRepositoryBundle {
  tagRepo: TagRepository;
  tagAssignmentRepo: TagAssignmentRepository;
  tagEntityTypeRepo: TagEntityTypeRepository;
}

/**
 * Factory function to create all tag-related repositories at once
 */
export function createTagRepositories(): TagRepositoryBundle {
  return {
    tagRepo: createTagRepository(),
    tagAssignmentRepo: createTagAssignmentRepository(),
    tagEntityTypeRepo: createTagEntityTypeRepository()
  };
}
