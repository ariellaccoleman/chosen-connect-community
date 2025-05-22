
export * from "./tagRepository";
export * from "./tagEntityTypesRepository";
export * from "./tagAssignmentsRepository";

/**
 * Create repository for tag entity types view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createTagEntityTypesViewRepository = () => {
  // Using the enhanced repository pattern
  const repository = {
    tableName: 'all_tags_with_entity_types_view',
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    },
    getById: async () => {
      return { data: null, error: null };
    },
    select: async () => {
      return { data: [], error: null };
    },
    insert: async () => {
      return { data: null, error: null };
    },
    update: async () => {
      return { data: null, error: null };
    },
    delete: async () => {
      return { data: null, error: null };
    }
  };
  return repository;
};

/**
 * Create repository for filtered entity tags view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createFilteredEntityTagsViewRepository = () => {
  // Using the enhanced repository pattern
  const repository = {
    tableName: 'filtered_entity_tags_view',
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    },
    getById: async () => {
      return { data: null, error: null };
    },
    select: async () => {
      return { data: [], error: null };
    },
    insert: async () => {
      return { data: null, error: null };
    },
    update: async () => {
      return { data: null, error: null };
    },
    delete: async () => {
      return { data: null, error: null };
    }
  };
  return repository;
};

/**
 * Create repository for entity tag assignments view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createEntityTagAssignmentsViewRepository = () => {
  // Using the enhanced repository pattern
  const repository = {
    tableName: 'entity_tag_assignments_view',
    getAll: async () => {
      return { data: [], error: null };
    },
    getByFilter: async () => {
      return { data: [], error: null };
    },
    getById: async () => {
      return { data: null, error: null };
    },
    select: async () => {
      return { data: [], error: null };
    },
    insert: async () => {
      return { data: null, error: null };
    },
    update: async () => {
      return { data: null, error: null };
    },
    delete: async () => {
      return { data: null, error: null };
    }
  };
  return repository;
};
