
import { DataRepository } from "../DataRepository";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { CoreRepositoryOperations } from "./coreOperations";
import { logger } from "@/utils/logger";

/**
 * Repository operations focused on batch processing capabilities
 */
export class BatchRepositoryOperations<T, TId = string> extends CoreRepositoryOperations<T, TId> {
  /**
   * Process items in chunks to avoid hitting API limits
   * @param items Items to process
   * @param chunkSize Size of each chunk
   * @param processor Function that processes each chunk
   * @returns Processed results
   */
  private async processInChunks<R>(
    items: any[],
    chunkSize: number,
    processor: (chunk: any[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  /**
   * Create multiple entities in batch
   * @param items Array of entity data to create
   * @param chunkSize Optional chunk size for processing (default: 100)
   * @returns Created entities
   */
  async batchCreate(items: Partial<T>[], chunkSize = 100): Promise<ApiResponse<T[]>> {
    if (!items || items.length === 0) {
      return createSuccessResponse([] as T[]);
    }
    
    try {
      const results = await this.processInChunks<T>(
        items,
        chunkSize,
        async (chunk) => {
          const result = await this.repository
            .insert(chunk)
            .execute();
          
          if (result.isError()) {
            throw result.error;
          }
          
          return Array.isArray(result.data) ? result.data : [result.data];
        }
      );
      
      logger.debug(`Successfully created ${results.length} ${this.entityName}s in batch`);
      return createSuccessResponse(results);
    } catch (error) {
      return this.handleError(error, "batch create");
    }
  }
  
  /**
   * Update multiple entities in batch
   * @param items Array of entities with IDs to update
   * @param idField Field to use as ID (default: 'id')
   * @param chunkSize Optional chunk size for processing (default: 100)
   * @returns Updated entities
   */
  async batchUpdate(
    items: Partial<T>[],
    idField: keyof T = 'id' as keyof T,
    chunkSize = 100
  ): Promise<ApiResponse<T[]>> {
    if (!items || items.length === 0) {
      return createSuccessResponse([] as T[]);
    }
    
    try {
      // Validate all items have IDs
      const missingIds = items.filter(item => !item[idField]);
      if (missingIds.length > 0) {
        throw new Error(`${missingIds.length} items missing IDs for batch update`);
      }
      
      const results = await this.processInChunks<T>(
        items,
        chunkSize,
        async (chunk) => {
          const updated: T[] = [];
          
          // Process updates one by one because most APIs don't support true batch updates
          for (const item of chunk) {
            const id = item[idField] as unknown as TId;
            // Remove the ID from the update data if present
            const updateData = { ...item };
            delete updateData[idField];
            
            const result = await this.repository
              .update(updateData)
              .eq(idField as string, id)
              .execute();
              
            if (!result.isError() && result.data) {
              updated.push(Array.isArray(result.data) ? result.data[0] : result.data);
            }
          }
          
          return updated;
        }
      );
      
      logger.debug(`Successfully updated ${results.length} ${this.entityName}s in batch`);
      return createSuccessResponse(results);
    } catch (error) {
      return this.handleError(error, "batch update");
    }
  }
  
  /**
   * Delete multiple entities in batch
   * @param ids Array of entity IDs to delete
   * @param chunkSize Optional chunk size for processing (default: 100)
   * @returns True if successful
   */
  async batchDelete(ids: TId[], chunkSize = 100): Promise<ApiResponse<boolean>> {
    if (!ids || ids.length === 0) {
      return createSuccessResponse(true);
    }
    
    try {
      await this.processInChunks<boolean>(
        ids,
        chunkSize,
        async (chunk) => {
          const result = await this.repository
            .delete()
            .in('id', chunk as (string | number)[])
            .execute();
            
          if (result.isError()) {
            throw result.error;
          }
          
          return [true];
        }
      );
      
      logger.debug(`Successfully deleted ${ids.length} ${this.entityName}s in batch`);
      return createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, "batch delete");
    }
  }
  
  /**
   * Upsert (insert or update) multiple entities in batch
   * @param items Array of entities
   * @param idField Field to use as ID (default: 'id')
   * @param chunkSize Optional chunk size for processing (default: 100)
   * @returns Upserted entities
   */
  async batchUpsert(
    items: Partial<T>[],
    idField: keyof T = 'id' as keyof T,
    chunkSize = 100
  ): Promise<ApiResponse<T[]>> {
    if (!items || items.length === 0) {
      return createSuccessResponse([] as T[]);
    }
    
    try {
      // Separate items with IDs (updates) and without IDs (inserts)
      const itemsWithIds = items.filter(item => item[idField]);
      const itemsWithoutIds = items.filter(item => !item[idField]);
      
      const results: T[] = [];
      
      // Process inserts
      if (itemsWithoutIds.length > 0) {
        const createResponse = await this.batchCreate(itemsWithoutIds, chunkSize);
        if (!createResponse.error && Array.isArray(createResponse.data)) {
          results.push(...createResponse.data);
        }
      }
      
      // Process updates
      if (itemsWithIds.length > 0) {
        const updateResponse = await this.batchUpdate(itemsWithIds, idField, chunkSize);
        if (!updateResponse.error && Array.isArray(updateResponse.data)) {
          results.push(...updateResponse.data);
        }
      }
      
      logger.debug(`Successfully upserted ${results.length} ${this.entityName}s in batch`);
      return createSuccessResponse(results);
    } catch (error) {
      return this.handleError(error, "batch upsert");
    }
  }
}

/**
 * Create batch repository operations for a repository
 */
export function createBatchOperations<T, TId = string>(
  repository: DataRepository<T>,
  entityName: string = "Entity"
): BatchRepositoryOperations<T, TId> {
  return new BatchRepositoryOperations<T, TId>(repository, entityName);
}
