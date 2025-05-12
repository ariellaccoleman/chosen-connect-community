
// Export all tag-related hooks from this central file
export { useTagCrudMutations } from './useTagCrudMutations';
export { useTagAssignmentMutations } from './useTagAssignmentMutations';
export { useTagFindOrCreate } from './useTagFindOrCreate';
export { useTagEntityType } from './useTagEntityType';
export { useTagBasicCrud } from './useTagBasicCrud';
export { useTagCreation } from './useTagCreation';

// Re-export for backward compatibility
import { useTagCrudMutations } from './useTagCrudMutations';
import { useTagAssignmentMutations } from './useTagAssignmentMutations';

// Combined hook for backward compatibility
export const useTagMutations = useTagCrudMutations;
