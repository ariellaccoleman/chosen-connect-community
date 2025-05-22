
export * from "./tagRepository";
export * from "./tagEntityTypesRepository";
export * from "./tagAssignmentsRepository";

/**
 * Create repository for tag entity types view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createTagEntityTypesViewRepository = () => {
  const { createEnhancedRepository } = require("@/api/core/repository");
  return createEnhancedRepository(
    'all_tags_with_entity_types_view',
    'supabase',
    undefined,
    { 
      idField: 'id',
      defaultSelect: '*',
      enableLogging: true
    }
  );
};

/**
 * Create repository for filtered entity tags view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createFilteredEntityTagsViewRepository = () => {
  const { createEnhancedRepository } = require("@/api/core/repository");
  return createEnhancedRepository(
    'filtered_entity_tags_view',
    'supabase',
    undefined,
    { 
      idField: 'id',
      defaultSelect: '*',
      enableLogging: true
    }
  );
};

/**
 * Create repository for entity tag assignments view
 * This conforms to the DataRepository interface expected by createApiFactory
 */
export const createEntityTagAssignmentsViewRepository = () => {
  const { createEnhancedRepository } = require("@/api/core/repository");
  return createEnhancedRepository(
    'entity_tag_assignments_view',
    'supabase',
    undefined,
    { 
      idField: 'id',
      defaultSelect: '*',
      enableLogging: true
    }
  );
};
