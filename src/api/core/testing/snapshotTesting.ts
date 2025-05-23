
import { RepositoryResponse } from '../repository/DataRepository';

/**
 * SnapshotConfig defines which fields to include or exclude in snapshots
 */
export interface SnapshotConfig {
  /**
   * Fields to exclude from snapshots (e.g. timestamps)
   */
  excludeFields?: string[];
  
  /**
   * Whether to include error objects in snapshots
   */
  includeErrors?: boolean;
  
  /**
   * Custom value transformers for specific fields
   */
  transformers?: Record<string, (value: any) => any>;
}

/**
 * Creates a repository response snapshot suitable for comparison in tests
 * 
 * @param response Repository response to snapshot
 * @param config Snapshot configuration options
 * @returns A snapshot object that can be used for comparisons
 */
export function createResponseSnapshot<T>(
  response: RepositoryResponse<T>,
  config: SnapshotConfig = {}
): any {
  const { excludeFields = ['created_at', 'updated_at'], includeErrors = true, transformers = {} } = config;
  
  // Create base snapshot
  const snapshot: Record<string, any> = {
    status: response.isSuccess() ? 'success' : 'error',
  };
  
  // Add data if present, with field exclusions
  if (response.data !== null) {
    if (Array.isArray(response.data)) {
      snapshot.data = response.data.map(item => sanitizeData(item, excludeFields, transformers));
    } else {
      snapshot.data = sanitizeData(response.data, excludeFields, transformers);
    }
  } else {
    snapshot.data = null;
  }
  
  // Add error information if requested
  if (includeErrors && response.error) {
    snapshot.error = {
      code: response.error.code,
      message: response.error.message,
    };
    
    if (response.error.details) {
      snapshot.error.details = response.error.details;
    }
  }
  
  return snapshot;
}

/**
 * Sanitizes entity data for snapshots by removing excluded fields
 * and applying any transformers
 */
function sanitizeData<T>(
  data: T, 
  excludeFields: string[],
  transformers: Record<string, (value: any) => any>
): Partial<T> {
  if (!data || typeof data !== 'object') return data;
  
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) continue;
    
    // Apply transformer if configured, otherwise use raw value
    const finalValue = transformers[key] 
      ? transformers[key](value)
      : value;
      
    // Handle nested objects/arrays
    if (finalValue && typeof finalValue === 'object') {
      if (Array.isArray(finalValue)) {
        (result as any)[key] = finalValue.map(item => 
          typeof item === 'object' ? sanitizeData(item, excludeFields, transformers) : item
        );
      } else {
        (result as any)[key] = sanitizeData(finalValue, excludeFields, transformers);
      }
    } else {
      (result as any)[key] = finalValue;
    }
  }
  
  return result;
}

/**
 * Compare two snapshots for equality
 */
export function compareSnapshots(
  snapshot1: any, 
  snapshot2: any
): { equal: boolean; differences?: string[] } {
  const differences: string[] = [];
  
  // Check for missing properties
  const allKeys = new Set([
    ...Object.keys(snapshot1 || {}), 
    ...Object.keys(snapshot2 || {})
  ]);
  
  for (const key of allKeys) {
    const val1 = snapshot1?.[key];
    const val2 = snapshot2?.[key];
    
    // Check if properties exist
    if (!(key in (snapshot1 || {}))) {
      differences.push(`Property "${key}" exists in second snapshot but not in first`);
      continue;
    }
    
    if (!(key in (snapshot2 || {}))) {
      differences.push(`Property "${key}" exists in first snapshot but not in second`);
      continue;
    }
    
    // Check value types
    if (typeof val1 !== typeof val2) {
      differences.push(`Property "${key}" has different types: ${typeof val1} vs ${typeof val2}`);
      continue;
    }
    
    // Compare objects
    if (typeof val1 === 'object' && val1 !== null && val2 !== null) {
      if (Array.isArray(val1) !== Array.isArray(val2)) {
        differences.push(`Property "${key}" has different types: array vs object`);
      } else if (Array.isArray(val1)) {
        // Compare arrays
        if (val1.length !== val2.length) {
          differences.push(`Array "${key}" has different lengths: ${val1.length} vs ${val2.length}`);
        } else {
          // Compare each array item
          for (let i = 0; i < val1.length; i++) {
            const result = compareSnapshots(val1[i], val2[i]);
            if (!result.equal) {
              differences.push(`Array "${key}" differs at index ${i}: ${result.differences?.join(', ')}`);
            }
          }
        }
      } else {
        // Compare nested objects
        const result = compareSnapshots(val1, val2);
        if (!result.equal) {
          differences.push(`Object "${key}" differs: ${result.differences?.join(', ')}`);
        }
      }
    } else if (val1 !== val2) {
      // Compare primitive values
      differences.push(`Property "${key}" has different values: ${val1} vs ${val2}`);
    }
  }
  
  return {
    equal: differences.length === 0,
    differences: differences.length > 0 ? differences : undefined
  };
}
