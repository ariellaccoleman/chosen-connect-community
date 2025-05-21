
import { DataRepository } from "@/api/core/repository";
import { createEnhancedRepository } from "@/api/core/repository";
import { TagEntityType } from "@/utils/tags/types";
import { logger } from "@/utils/logger";

/**
 * Repository for tag entity types operations
 */
export function createTagEntityTypesRepository(): DataRepository<TagEntityType> {
  return createEnhancedRepository<TagEntityType>(
    "tag_entity_types",
    "supabase",
    undefined,
    {
      idField: "id",
      defaultSelect: "*",
      enableLogging: true,
      transformResponse: (data: any): TagEntityType => ({
        id: data.id,
        tag_id: data.tag_id,
        entity_type: data.entity_type,
        created_at: data.created_at,
        updated_at: data.updated_at
      })
    }
  );
}
