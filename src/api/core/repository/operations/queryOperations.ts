
import { DataRepository } from "../DataRepository";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { CoreRepositoryOperations } from "./coreOperations";

/**
 * Repository operations focused on advanced querying capabilities
 */
export class QueryRepositoryOperations<T, TId = string> extends CoreRepositoryOperations<T, TId> {
  /**
   * Get entities by a list of IDs with error handling
   */
  async getByIds(ids: TId[]): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .in("id", ids as (string | number)[])
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
   * Find entities by a specific field value
   */
  async findBy(field: string, value: any): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .eq(field, value)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "find");
    }
  }
  
  /**
   * Search entities using case-insensitive pattern matching
   */
  async search(field: string, searchTerm: string): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .ilike(field, `%${searchTerm}%`)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "search");
    }
  }
  
  /**
   * Filter entities by multiple tags
   */
  async filterByTagIds(tagIds: string[]): Promise<ApiResponse<T[]>> {
    try {
      // This implementation assumes that tag IDs are stored in a column called 'tag_id'
      // Adjust the field name if your data model is different
      const result = await this.repository
        .select()
        .in("tag_id", tagIds)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "filter by tags");
    }
  }
}
