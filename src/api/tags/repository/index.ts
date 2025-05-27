
import { createTagRepository } from './TagRepository';
import { createTagAssignmentRepository } from './TagAssignmentRepository';
import { createTagEntityTypeRepository } from './TagEntityTypeRepository';

// Export the factory functions
export { createTagRepository, createTagAssignmentRepository, createTagEntityTypeRepository };

// Export the interfaces for type checking
export type { TagRepository } from './TagRepository';
export type { TagAssignmentRepository } from './TagAssignmentRepository';
export type { TagEntityTypeRepository } from './TagEntityTypeRepository';
