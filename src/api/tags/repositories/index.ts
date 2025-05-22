
export * from "./tagRepository";
export * from "./tagEntityTypesRepository";
export * from "./tagAssignmentsRepository";

/**
 * Create repository for tag entity types view
 */
export const createTagEntityTypesViewRepository = () => {
  // For now, we'll return a simple object with query methods
  return {
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    }
  };
};

/**
 * Create repository for filtered entity tags view
 */
export const createFilteredEntityTagsViewRepository = () => {
  // For now, we'll return a simple object with query methods
  return {
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    }
  };
};

/**
 * Create repository for entity tag assignments view
 */
export const createEntityTagAssignmentsViewRepository = () => {
  // For now, we'll return a simple object with query methods
  return {
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    }
  };
};
