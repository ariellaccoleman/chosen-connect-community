
import { ApiOperations } from "./types";

/**
 * Helper function to extend base API operations with custom operations
 * 
 * @param baseOperations - The base CRUD operations created by apiFactory
 * @param customOperations - Custom operations specific to an entity
 * @returns Combined API operations
 */
export function extendApiOperations<
  T,
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  TCustom extends Record<string, any> = Record<string, never>
>(
  baseOperations: ApiOperations<T, TId, TCreate, TUpdate>,
  customOperations: TCustom
): ApiOperations<T, TId, TCreate, TUpdate> & TCustom {
  return {
    ...baseOperations,
    ...customOperations
  };
}

/**
 * Creates a function that overrides specific operations in the base API
 * 
 * @param baseOperations - The base CRUD operations created by apiFactory
 * @param overrides - Operations to override
 * @returns Combined API operations with overridden methods
 */
export function overrideApiOperations<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>
>(
  baseOperations: ApiOperations<T, TId, TCreate, TUpdate>,
  overrides: Partial<ApiOperations<T, TId, TCreate, TUpdate>>
): ApiOperations<T, TId, TCreate, TUpdate> {
  return {
    ...baseOperations,
    ...overrides
  };
}
