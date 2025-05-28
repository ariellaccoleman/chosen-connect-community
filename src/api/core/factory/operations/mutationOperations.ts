
import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";
import { DataRepository } from "../../repository/DataRepository";

/**
 * Options for creating mutation operations
 */
interface MutationOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
}

/**
 * Creates standardized mutation operations (create, update, delete) for an entity
 */
export function createMutationOperations<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  entityName: string,
  tableName: Table,
  options: MutationOperationsOptions<T> = {}
) {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    softDelete = false,
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as unknown as Record<string, any>,
    repository: repoOption
  } = options;

  // Resolve repository (handle both direct instances and factory functions)
  const repository = typeof repoOption === 'function' ? repoOption() : repoOption;

  // Type assertion for ID field
  const typedIdField = idField as string;
  
  /**
   * Create a new entity
   */
  const create = async (data: TCreate): Promise<ApiResponse<T>> => {
    try {
      logger.debug(`Creating new ${entityName}:`, data);
      
      const transformedData = transformRequest(data as any);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const result = await repository
          .insert(transformedData)
          .select(defaultSelect)
          .single();
        
        if (result.error) throw result.error;
        
        return createSuccessResponse(transformResponse(result.data));
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        const { data: createdData, error } = await client
          .from(tableName)
          .insert(transformedData as any)
          .select(defaultSelect)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(createdData));
      });
    } catch (error) {
      logger.error(`Error creating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Update an existing entity
   */
  const update = async (id: TId, data: TUpdate): Promise<ApiResponse<T>> => {
    try {
      logger.debug(`Updating ${entityName} with ID: ${String(id)}`, data);
      
      const transformedData = transformRequest(data as any);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const result = await repository
          .update(transformedData)
          .eq(typedIdField, id as any)
          .select(defaultSelect)
          .single();
        
        if (result.error) throw result.error;
        
        return createSuccessResponse(transformResponse(result.data));
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        const { data: updatedData, error } = await client
          .from(tableName)
          .update(transformedData as any)
          .eq(typedIdField, id as any)
          .select(defaultSelect)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(updatedData));
      });
    } catch (error) {
      logger.error(`Error updating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Delete an entity (hard delete or soft delete)
   */
  const deleteEntity = async (id: TId): Promise<ApiResponse<boolean>> => {
    try {
      logger.debug(`Deleting ${entityName} with ID: ${String(id)}`);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        let result;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { 
            updated_at: new Date().toISOString(),
            deleted_at: new Date().toISOString()
          };
          
          result = await repository
            .update(updateData)
            .eq(typedIdField, id as any)
            .select('id', { count: 'exact' })
            .execute();
        } else {
          // Hard delete
          result = await repository
            .delete()
            .eq(typedIdField, id as any)
            .select('id', { count: 'exact' })
            .execute();
        }
        
        if (result.error) throw result.error;
        
        // Check if any rows were actually affected
        const affectedCount = result.count || (result.data ? result.data.length : 0);
        
        return createSuccessResponse(affectedCount > 0);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        let result;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { updated_at: new Date().toISOString() } as Record<string, any>;
          updateData.deleted_at = new Date().toISOString();
          
          result = await client
            .from(tableName)
            .update(updateData as any)
            .eq(typedIdField, id as any)
            .select('id', { count: 'exact' });
        } else {
          // Hard delete
          result = await client
            .from(tableName)
            .delete()
            .eq(typedIdField, id as any)
            .select('id', { count: 'exact' });
        }
        
        if (result.error) throw result.error;
        
        // Check if any rows were actually affected
        const affectedCount = result.count || (result.data ? result.data.length : 0);
        
        return createSuccessResponse(affectedCount > 0);
      });
    } catch (error) {
      logger.error(`Error deleting ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    create,
    update,
    delete: deleteEntity
  };
}
