
import { DataRepository } from "@/api/core/repository";
import { createEnhancedRepository } from "@/api/core/repository";
import { TagAssignment } from "@/utils/tags/types";
import { logger } from "@/utils/logger";

/**
 * Repository for tag assignments operations
 */
export function createTagAssignmentsRepository(): DataRepository<TagAssignment> {
  return createEnhancedRepository<TagAssignment>(
    "tag_assignments",
    "supabase",
    undefined,
    {
      idField: "id",
      defaultSelect: "*",
      enableLogging: true,
      transformResponse: (data: any): TagAssignment => ({
        id: data.id,
        tag_id: data.tag_id,
        target_id: data.target_id,
        target_type: data.target_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
        tag: data.tag
      })
    }
  );
}
