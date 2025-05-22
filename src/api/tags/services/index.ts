
/**
 * Tag Services Export Module
 * Exports all tag-related service classes and factory functions
 */

// Export the services
export * from './TagService';
export * from './TagAssignmentService';

// Export a factory function that creates all services
import { createTagService, TagService } from './TagService';
import { createTagAssignmentService, TagAssignmentService } from './TagAssignmentService';

/**
 * Service bundle containing all tag-related services
 */
export interface TagServiceBundle {
  tagService: TagService;
  tagAssignmentService: TagAssignmentService;
}

/**
 * Factory function to create all tag-related services at once
 */
export function createTagServices(): TagServiceBundle {
  return {
    tagService: createTagService(),
    tagAssignmentService: createTagAssignmentService()
  };
}
