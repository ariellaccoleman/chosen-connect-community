
import { DataRepository } from "@/api/core/repository";
import { createEnhancedRepository } from "@/api/core/repository";
import { Tag } from "@/utils/tags/types";
import { logger } from "@/utils/logger";

/**
 * Repository for tag operations
 */
export function createTagRepository(): DataRepository<Tag> {
  return createEnhancedRepository<Tag>(
    "tags",
    "supabase",
    undefined,
    {
      idField: "id",
      defaultSelect: "*",
      enableLogging: true,
      transformResponse: (data: any): Tag => ({
        id: data.id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        entity_types: data.entity_types || []
      })
    }
  );
}

/**
 * Repository for tag entity types view operations
 */
export function createTagEntityTypesViewRepository(): DataRepository<Tag> {
  return createEnhancedRepository<Tag>(
    "all_tags_with_entity_types_view",
    "supabase",
    undefined,
    {
      idField: "id",
      defaultSelect: "*",
      enableLogging: true
    }
  );
}

/**
 * Repository for filtered entity tags view operations 
 */
export function createFilteredEntityTagsViewRepository(): DataRepository<Tag> {
  return createEnhancedRepository<Tag>(
    "filtered_entity_tags_view", 
    "supabase",
    undefined,
    { 
      idField: "id",
      defaultSelect: "*",
      enableLogging: true
    }
  );
}

/**
 * Repository for entity tag assignments view operations
 */
export function createEntityTagAssignmentsViewRepository(): DataRepository<any> {
  return createEnhancedRepository<any>(
    "entity_tag_assignments_view",
    "supabase",
    undefined,
    {
      idField: "id", 
      defaultSelect: "*",
      enableLogging: true
    }
  );
}
