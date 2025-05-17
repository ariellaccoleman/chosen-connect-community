
import { DataRepository } from "./DataRepository";
import { logger } from "@/utils/logger";
import { ApiResponse } from "../errorHandler";

/**
 * Standard operations that can be applied to any repository
 */
export class StandardRepositoryOperations<T, TId = string> {
  constructor(
    private repository: DataRepository<T>,
    private entityName: string = "Entity"
  ) {}

  /**
   * Get a single entity by ID with error handling
   */
  async getById(id: TId): Promise<ApiResponse<T | null>> {
    try {
      const result = await this.repository.getById(id as string | number);
      return {
        data: result,
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error getting ${this.entityName} by ID:`, error);
      return {
        data: null,
        status: "error",
        error: `Failed to retrieve ${this.entityName.toLowerCase()}`
      };
    }
  }

  /**
   * Get all entities with error handling
   */
  async getAll(): Promise<ApiResponse<T[]>> {
    try {
      const results = await this.repository.getAll();
      return {
        data: results,
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error getting all ${this.entityName}s:`, error);
      return {
        data: [],
        status: "error",
        error: `Failed to retrieve ${this.entityName.toLowerCase()} list`
      };
    }
  }

  /**
   * Get entities by a list of IDs with error handling
   */
  async getByIds(ids: TId[]): Promise<ApiResponse<T[]>> {
    try {
      const results = await this.repository
        .select()
        .in("id", ids as (string | number)[])
        .execute();
      
      return {
        data: results || [],
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error getting ${this.entityName}s by IDs:`, error);
      return {
        data: [],
        status: "error",
        error: `Failed to retrieve ${this.entityName.toLowerCase()} items`
      };
    }
  }

  /**
   * Create a new entity with error handling
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const result = await this.repository.insert(data as Record<string, any>);
      return {
        data: result,
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error creating ${this.entityName}:`, error);
      return {
        data: null as any,
        status: "error",
        error: `Failed to create ${this.entityName.toLowerCase()}`
      };
    }
  }

  /**
   * Update an existing entity with error handling
   */
  async update(id: TId, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const result = await this.repository.update(
        id as string | number,
        data as Record<string, any>
      );
      
      return {
        data: result,
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error updating ${this.entityName}:`, error);
      return {
        data: null as any,
        status: "error",
        error: `Failed to update ${this.entityName.toLowerCase()}`
      };
    }
  }

  /**
   * Delete an entity with error handling
   */
  async delete(id: TId): Promise<ApiResponse<boolean>> {
    try {
      await this.repository.delete(id as string | number);
      return {
        data: true,
        status: "success",
        error: null
      };
    } catch (error) {
      logger.error(`Error deleting ${this.entityName}:`, error);
      return {
        data: false,
        status: "error",
        error: `Failed to delete ${this.entityName.toLowerCase()}`
      };
    }
  }

  /**
   * Check if an entity with the given ID exists
   */
  async exists(id: TId): Promise<boolean> {
    try {
      const result = await this.repository
        .select("id")
        .eq("id", id as string | number)
        .maybeSingle()
        .execute();
      
      return result !== null;
    } catch (error) {
      logger.error(`Error checking if ${this.entityName} exists:`, error);
      return false;
    }
  }

  /**
   * Count entities matching a filter condition
   */
  async count(column: string, value: any): Promise<number> {
    try {
      const { count } = await this.repository
        .select("id", { count: true })
        .eq(column, value)
        .execute();
      
      return count || 0;
    } catch (error) {
      logger.error(`Error counting ${this.entityName}s:`, error);
      return 0;
    }
  }
}

/**
 * Create standard repository operations for a repository
 */
export function createStandardOperations<T, TId = string>(
  repository: DataRepository<T>,
  entityName: string = "Entity"
): StandardRepositoryOperations<T, TId> {
  return new StandardRepositoryOperations<T, TId>(repository, entityName);
}
