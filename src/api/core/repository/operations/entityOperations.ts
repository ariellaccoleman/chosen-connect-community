
import { Entity } from "@/types/entity";
import { DataRepository } from "../DataRepository";
import { EntityType } from "@/types/entityTypes";
import { CoreRepositoryOperations } from "./coreOperations";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { logger } from "@/utils/logger";

/**
 * Enhanced operations for working with entity objects
 */
export class EntityRepositoryOperations<T extends Entity> extends CoreRepositoryOperations<T> {
  /**
   * Entity type this operation class handles
   */
  protected entityType: EntityType;

  constructor(
    repository: DataRepository<T>,
    entityType: EntityType,
    entityName: string = "Entity"
  ) {
    super(repository, entityName);
    this.entityType = entityType;
  }

  /**
   * Get entities by their entity type
   */
  async getByEntityType(): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .eq("entityType", this.entityType)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      logger.error(`Error getting entities by type ${this.entityType}:`, error);
      return createErrorResponse({ 
        message: `Failed to get ${this.entityName.toLowerCase()}s by type ${this.entityType}` 
      });
    }
  }

  /**
   * Get entities with tag assignments
   */
  async getWithTags(id: string): Promise<ApiResponse<T>> {
    try {
      // First get the entity
      const entityResult = await this.repository
        .select()
        .eq("id", id)
        .single();
        
      if (entityResult.isError()) {
        throw entityResult.error;
      }
      
      // Check if entity was found
      if (!entityResult.data) {
        return createErrorResponse({
          code: "not_found",
          message: `${this.entityName} not found`
        });
      }
      
      // In a real implementation, we would join with tag_assignments
      // This is a simplified placeholder
      const entity = entityResult.data as T;
      
      return createSuccessResponse(entity);
    } catch (error) {
      logger.error(`Error getting ${this.entityName} with tags:`, error);
      return createErrorResponse({ 
        message: `Failed to get ${this.entityName.toLowerCase()} with tags` 
      });
    }
  }

  /**
   * Validate an entity before saving
   */
  validateEntity(entity: T): { isValid: boolean; errors?: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    // Basic validation common to all entities
    if (!entity.name || entity.name.trim() === '') {
      errors.name = "Name is required";
    }
    
    if (!entity.entityType) {
      errors.entityType = "Entity type is required";
    } else if (entity.entityType !== this.entityType) {
      errors.entityType = `Entity type must be ${this.entityType}`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }
}

/**
 * Create entity repository operations
 */
export function createEntityOperations<T extends Entity>(
  repository: DataRepository<T>,
  entityType: EntityType,
  entityName: string = "Entity"
): EntityRepositoryOperations<T> {
  return new EntityRepositoryOperations<T>(repository, entityType, entityName);
}
