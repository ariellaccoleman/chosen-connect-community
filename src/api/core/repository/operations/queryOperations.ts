
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
   * Filter entities by tag ID using proper PostgreSQL array operators
   * Works with both tag_names (text[]) and tags (jsonb[]) columns
   */
  async filterByTagIds(tagIds: string[]): Promise<ApiResponse<T[]>> {
    try {
      if (!tagIds || tagIds.length === 0) {
        return this.getAll();
      }

      // For single tag ID filtering, we'll check if any of the tag objects in the jsonb array
      // contain the specified tag ID, or if any tag names match
      const tagId = tagIds[0]; // For now, handle single tag filtering
      
      const result = await this.repository
        .select()
        .or(`tags->@.{"id":"${tagId}"},tag_names.cs.{${tagId}}`)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "filter by tags");
    }
  }

  /**
   * Filter entities by tag names using PostgreSQL array contains operator
   */
  async filterByTagNames(tagNames: string[]): Promise<ApiResponse<T[]>> {
    try {
      if (!tagNames || tagNames.length === 0) {
        return this.getAll();
      }

      // Use array overlap operator to find entities that have any of the specified tag names
      const result = await this.repository
        .select()
        .overlaps('tag_names', tagNames)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      return this.handleError(error, "filter by tag names");
    }
  }
}
