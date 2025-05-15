
import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";
import { DataRepository } from "../../repository/repositoryFactory";

/**
 * Options for creating mutation operations
 */
interface MutationOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T>;
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
    repository
  } = options;

  // Type assertion for ID field
  const typedIdField = idField as string;
  
  /**
   * Create a new entity
   */
  const create = async (data: TCreate): Promise<ApiResponse<T>> => {
    try {
      logger.debug(`Creating new ${entityName}:`, data);
      
      const transformedData = transformRequest(data);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const { data: createdData, error } = await repository
          .insert(transformedData as any)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(createdData));
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
      
      const transformedData = transformRequest(data);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const { data: updatedData, error } = await repository
          .update(transformedData as any)
          .eq(typedIdField, id as any)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(updatedData));
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
        let error = null;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { 
            updated_at: new Date().toISOString(),
            deleted_at: new Date().toISOString()
          };
          
          const result = await repository
            .update(updateData)
            .eq(typedIdField, id as any)
            .execute();
          
          error = result.error;
        } else {
          // Hard delete
          const result = await repository
            .delete()
            .eq(typedIdField, id as any)
            .execute();
          
          error = result.error;
        }
        
        if (error) throw error;
        
        return createSuccessResponse(true);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        let error = null;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { updated_at: new Date().toISOString() } as Record<string, any>;
          updateData.deleted_at = new Date().toISOString();
          
          const result = await client
            .from(tableName)
            .update(updateData as any)
            .eq(typedIdField, id as any);
          
          error = result.error;
        } else {
          // Hard delete
          const result = await client
            .from(tableName)
            .delete()
            .eq(typedIdField, id as any);
          
          error = result.error;
        }
        
        if (error) throw error;
        
        return createSuccessResponse(true);
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
