
import { DataRepository, RepositoryResponse } from "../DataRepository";
import { logger } from "@/utils/logger";
import { ApiResponse, ApiError, createSuccessResponse, createErrorResponse } from "../../errorHandler";

/**
 * Base class for repository operations with common utilities
 */
export class CoreRepositoryOperations<T, TId = string> {
  constructor(
    protected repository: DataRepository<T>,
    protected entityName: string = "Entity"
  ) {}

  /**
   * Handle general repository errors
   */
  protected handleError(error: any, operation: string): ApiResponse<any> {
    logger.error(`Error ${operation} ${this.entityName}:`, error);
    return createErrorResponse({ 
      message: `Failed to ${operation} ${this.entityName.toLowerCase()}` 
    } as ApiError);
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "retrieve");
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
        .maybeSingle();
        
      if (result.isError()) {
        throw result.error;
      }
        
      return result.data !== null;
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
      const result = await this.repository
        .select("id")
        .eq(column, value)
        .execute();
        
      if (result.isError()) {
        return 0;
      }
      
      // If the repository implementation supports count, use it
      if (result.data && typeof result.data === 'object' && 'count' in result.data) {
        return (result.data as any).count || 0;
      }
      
      // Otherwise, count the results manually
      return Array.isArray(result.data) ? result.data.length : 0;
    } catch (error) {
      logger.error(`Error counting ${this.entityName}s:`, error);
      return 0;
    }
  }
}
