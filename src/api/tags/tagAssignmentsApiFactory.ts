
import { createApiFactory } from '../core/factory';
import { createEntityTagAssignmentsViewRepository } from './repositories';

/**
 * Create API operations for entity tag assignments view
 * Using a type assertion to allow using the view name
 */
export const entityTagAssignmentsViewApi = createApiFactory<any, string, never, never, any>(
  {
    tableName: 'entity_tag_assignments_view' as any,
    entityName: 'entity tag assignment',
    repository: createEntityTagAssignmentsViewRepository(),
    useQueryOperations: true,
    useMutationOperations: false,
    useBatchOperations: false
  }
);

// Export individual operations
export const getAllEntityTagAssignments = entityTagAssignmentsViewApi.getAll;
export const getEntityTagAssignments = entityTagAssignmentsViewApi.getAll; // Changed from getByFilter to getAll
