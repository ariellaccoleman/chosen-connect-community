
export * from "./tagRepository";
export * from "./tagEntityTypesRepository";
export * from "./tagAssignmentsRepository";

/**
 * Create repository for tag entity types view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createTagEntityTypesViewRepository = () => {
  return {
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
};

/**
 * Create repository for filtered entity tags view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createFilteredEntityTagsViewRepository = () => {
  return {
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
};

/**
 * Create repository for entity tag assignments view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createEntityTagAssignmentsViewRepository = () => {
  return {
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
};
