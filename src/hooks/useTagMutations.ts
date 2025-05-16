
// This file is maintained for backward compatibility
// It re-exports hooks from the new tag hooks directory

import { 
  useTagCrudMutations, 
  useTagAssignmentMutations,
  useTagFindOrCreate,
  useTagEntityType,
  useTagBasicCrud
} from './tag';

// Re-export hooks with their original names for backward compatibility
export const useTagMutations = useTagCrudMutations;
export { 
  useTagAssignmentMutations,
  useTagFindOrCreate,
  useTagEntityType,
  useTagBasicCrud
};

