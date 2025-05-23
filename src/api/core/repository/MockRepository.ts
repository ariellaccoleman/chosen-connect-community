import { DataRepository, RepositoryQuery, RepositoryResponse, RepositoryError } from './DataRepository';
import { createSuccessResponse, createErrorResponse } from './repositoryUtils';
import { BaseRepository } from './BaseRepository';
import { logger } from '@/utils/logger';

/**
 * Mock implementation of the DataRepository interface for testing
 */
export class MockRepository<T = any> extends BaseRepository<T> {
  private mockData: Record<string, any[]> = {};
  private mockResponses: Record<string, any> = {};
  private lastOperation: string | null = null;
  private lastData: any = null;
  private filters: any[] = [];
  private inConditions: { column: string; values: any[] }[] = [];
  
  constructor(tableName: string, initialData: T[] = []) {
    super(tableName);
    this.mockData[tableName] = [...initialData];
  }

  /**
   * Set mock response for a specific operation
   */
  setMockResponse(operation: string, response: any): void {
    this.mockResponses[operation] = response;
  }

  /**
   * Get the last operation performed
   */
  getLastOperation(): string | null {
    return this.lastOperation;
  }

  /**
   * Get the last data used in an operation
   */
  getLastData(): any {
    return this.lastData;
  }
  
  /**
   * Reset filters and conditions
   */
  private resetFilters(): void {
    this.filters = [];
    this.inConditions = [];
  }

  /**
   * Get a record by ID - implementation from BaseRepository will be used
   */
  async getById(id: string | number): Promise<T | null> {
    const result = await this.select().eq(this.options.idField, id).maybeSingle();
    return result.data as T | null;
  }

  /**
   * Get all records - implementation from BaseRepository will be used
   */
  async getAll(): Promise<T[]> {
    const result = await this.select().execute();
    return result.data as T[];
  }

  /**
   * Create a select query
   */
  select(selectQuery = '*'): RepositoryQuery<T> {
    this.lastOperation = 'select';
    this.resetFilters();
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.filters,
      this.inConditions
    );
  }

  /**
   * Create an insert query
   */
  insert(data: Record<string, any> | Record<string, any>[]): RepositoryQuery<T> {
    this.lastOperation = 'insert';
    this.lastData = data;
    this.resetFilters();
    
    // Auto-update mock data if no specific mock response is set
    if (!this.mockResponses[this.lastOperation]) {
      // Handle both single items and arrays
      const dataArray = Array.isArray(data) ? data : [data];
      
      const newItems = dataArray.map(item => ({
        [this.options.idField]: item[this.options.idField] || `mock-id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...item
      }));
      
      this.mockData[this.tableName] = [
        ...(this.mockData[this.tableName] || []),
        ...newItems
      ];
    }
    
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.filters,
      this.inConditions,
      this.lastData
    );
  }

  /**
   * Create an update query
   */
  update(data: Record<string, any>): RepositoryQuery<T> {
    this.lastOperation = 'update';
    this.lastData = data;
    this.resetFilters();
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.filters,
      this.inConditions,
      this.lastData
    );
  }

  /**
   * Create a delete query
   */
  delete(): RepositoryQuery<T> {
    this.lastOperation = 'delete';
    this.resetFilters();
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.filters,
      this.inConditions
    );
  }

  /**
   * Standard error handling for repository operations - inherited from BaseRepository
   * This implementation will be provided by the BaseRepository
   */
  protected handleError(operation: string, error: any, context: Record<string, any> = {}): void {
    super.handleError(operation, error, context);
  }

  /**
   * Monitor performance of repository operations - inherited from BaseRepository
   * This implementation will be provided by the BaseRepository
   */
  protected monitorPerformance<R>(operation: string, callback: () => Promise<R>): Promise<R> {
    return super.monitorPerformance(operation, callback);
  }
}

/**
 * Mock implementation of the RepositoryQuery interface
 */
class MockQuery<T> implements RepositoryQuery<T> {
  private tableName: string;
  private mockData: Record<string, any[]>;
  private mockResponses: Record<string, any>;
  private operation: string;
  private operationData: any;
  private filters: Array<(item: any) => boolean>;
  private inConditions: { column: string; values: any[] }[];
  private sortConfig: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private rangeValues: [number, number] | null = null;
  private selectFields: string = '*';
  private preserveOrder: boolean = false; // Changed to false as default

  constructor(
    tableName: string,
    mockData: Record<string, any[]>,
    mockResponses: Record<string, any>,
    operation: string,
    filters: Array<(item: any) => boolean> = [],
    inConditions: { column: string; values: any[] }[] = [],
    operationData?: any
  ) {
    this.tableName = tableName;
    this.mockData = mockData;
    this.mockResponses = mockResponses;
    this.operation = operation;
    this.filters = [...filters]; // Create a copy to avoid modifying shared array
    this.inConditions = [...inConditions]; // Create a copy to avoid modifying shared array
    this.operationData = operationData;
  }

  eq(column: string, value: any): RepositoryQuery<T> {
    // Log for debugging
    console.log(`Adding filter for ${column} === ${value}`);
    
    this.filters.push(item => {
      const result = item[column] === value;
      console.log(`Filter ${column} === ${value} on item ${JSON.stringify(item)} result: ${result}`);
      return result;
    });
    return this;
  }

  neq(column: string, value: any): RepositoryQuery<T> {
    this.filters.push(item => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]): RepositoryQuery<T> {
    this.inConditions.push({ column, values });
    this.filters.push(item => values.includes(item[column]));
    return this;
  }

  ilike(column: string, pattern: string): RepositoryQuery<T> {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push(item => regex.test(String(item[column] || '')));
    return this;
  }
  
  /**
   * Filter for NULL values
   * @param column Column name
   * @param isNull Whether the value should be NULL (true) or NOT NULL (false)
   * @returns The query builder for chaining
   */
  is(column: string, isNull: null | boolean): RepositoryQuery<T> {
    if (isNull === null || isNull === true) {
      // Check for NULL values
      this.filters.push(item => 
        item[column] === null || item[column] === undefined
      );
    } else {
      // Check for NOT NULL values
      this.filters.push(item => 
        item[column] !== null && item[column] !== undefined
      );
    }
    return this;
  }

  /**
   * Filter by greater than
   */
  gt(column: string, value: any): RepositoryQuery<T> {
    this.filters.push(item => {
      const itemValue = item[column];
      const compareValue = value;
      
      if (itemValue === null || itemValue === undefined) {
        return false;
      }
      
      // Handle date comparison
      if (itemValue instanceof Date && compareValue instanceof Date) {
        return itemValue > compareValue;
      }
      
      // Handle string dates
      if (typeof itemValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(itemValue)) {
        const itemDate = new Date(itemValue);
        const compareDate = new Date(compareValue);
        if (!isNaN(itemDate.getTime()) && !isNaN(compareDate.getTime())) {
          return itemDate > compareDate;
        }
      }
      
      // Default comparison
      return itemValue > compareValue;
    });
    return this;
  }

  /**
   * Filter by greater than or equal to
   */
  gte(column: string, value: any): RepositoryQuery<T> {
    this.filters.push(item => {
      // Handle numeric comparison properly
      const itemValue = item[column];
      const compareValue = value;
      
      if (itemValue === null || itemValue === undefined) {
        return false;
      }
      
      // Handle date comparison
      if (itemValue instanceof Date && compareValue instanceof Date) {
        return itemValue >= compareValue;
      }
      
      // Handle string dates
      if (typeof itemValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(itemValue)) {
        const itemDate = new Date(itemValue);
        const compareDate = new Date(compareValue);
        if (!isNaN(itemDate.getTime()) && !isNaN(compareDate.getTime())) {
          return itemDate >= compareDate;
        }
      }
      
      // Default comparison
      return itemValue >= compareValue;
    });
    return this;
  }
  
  /**
   * Filter by less than
   */
  lt(column: string, value: any): RepositoryQuery<T> {
    this.filters.push(item => {
      const itemValue = item[column];
      const compareValue = value;
      
      if (itemValue === null || itemValue === undefined) {
        return false;
      }
      
      // Handle date comparison
      if (itemValue instanceof Date && compareValue instanceof Date) {
        return itemValue < compareValue;
      }
      
      // Handle string dates
      if (typeof itemValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(itemValue)) {
        const itemDate = new Date(itemValue);
        const compareDate = new Date(compareValue);
        if (!isNaN(itemDate.getTime()) && !isNaN(compareDate.getTime())) {
          return itemDate < compareDate;
        }
      }
      
      // Default comparison
      return itemValue < compareValue;
    });
    return this;
  }
  
  /**
   * Filter by less than or equal to
   */
  lte(column: string, value: any): RepositoryQuery<T> {
    this.filters.push(item => {
      const itemValue = item[column];
      const compareValue = value;
      
      if (itemValue === null || itemValue === undefined) {
        return false;
      }
      
      // Handle date comparison
      if (itemValue instanceof Date && compareValue instanceof Date) {
        return itemValue <= compareValue;
      }
      
      // Handle string dates
      if (typeof itemValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(itemValue)) {
        const itemDate = new Date(itemValue);
        const compareDate = new Date(compareValue);
        if (!isNaN(itemDate.getTime()) && !isNaN(compareDate.getTime())) {
          return itemDate <= compareDate;
        }
      }
      
      // Default comparison
      return itemValue <= compareValue;
    });
    return this;
  }
  
  /**
   * Filter with OR conditions
   */
  or(filter: string): RepositoryQuery<T> {
    // Parse the filter string, which is in format "column.operator.value,column.operator.value"
    const conditions = filter.split(',');
    
    this.filters.push(item => {
      return conditions.some(condition => {
        const parts = condition.split('.');
        if (parts.length < 3) return false;
        
        const column = parts[0];
        const operator = parts[1];
        const value = parts.slice(2).join('.'); // Rejoin in case the value contains dots
        
        switch (operator) {
          case 'eq':
            return item[column] === value;
          case 'neq':
            return item[column] !== value;
          case 'ilike':
            const pattern = value.replace(/%/g, '.*');
            const regex = new RegExp(pattern, 'i');
            return regex.test(String(item[column] || ''));
          case 'is':
            if (value === 'null') {
              return item[column] === null || item[column] === undefined;
            } else {
              return item[column] !== null && item[column] !== undefined;
            }
          default:
            return false;
        }
      });
    });
    
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): RepositoryQuery<T> {
    this.sortConfig = { 
      column, 
      ascending: options.ascending ?? true 
    };
    this.preserveOrder = false; // When explicit ordering is requested, don't preserve original order
    return this;
  }

  limit(count: number): RepositoryQuery<T> {
    this.limitValue = count;
    return this;
  }
  
  /**
   * Skip a number of results
   */
  offset(count: number): RepositoryQuery<T> {
    this.offsetValue = count;
    return this;
  }

  range(from: number, to: number): RepositoryQuery<T> {
    this.rangeValues = [from, to];
    return this;
  }
  
  select(fields: string = '*'): RepositoryQuery<T> {
    this.selectFields = fields;
    return this;
  }

  async single(): Promise<RepositoryResponse<T>> {
    console.log(`[MockQuery] Executing single() for operation ${this.operation}`);
    console.log(`[MockQuery] Current table: ${this.tableName}, filters count: ${this.filters.length}`);
    
    // Check if there's a mock response for this specific operation
    const mockResponseKey = `${this.operation}_single`;
    if (this.mockResponses[mockResponseKey]) {
      return this.mockResponses[mockResponseKey];
    }

    // Otherwise, process based on operation
    if (this.operation === 'insert') {
      const newItem = {
        id: `mock-id-${Date.now()}`,
        ...this.operationData 
      };
      console.log(`[MockQuery] Insert operation returning: ${JSON.stringify(newItem)}`);
      return createSuccessResponse<T>(newItem as unknown as T);
    }

    if (this.operation === 'update') {
      // Find the first item that matches all filters
      const items = this.mockData[this.tableName] || [];
      console.log(`[MockQuery] Update operation, total items: ${items.length}`);
      const filtered = this.applyFilters(items);
      console.log(`[MockQuery] Update filtered items: ${filtered.length}`);
      
      if (filtered.length === 0) {
        console.log(`[MockQuery] Update operation - no items found matching filters`);
        return createErrorResponse<T>({
          code: 'not_found',
          message: 'Item not found',
          details: { tableName: this.tableName }
        });
      }

      // Update the first matching item
      const updatedItem = { ...filtered[0], ...this.operationData };
      console.log(`[MockQuery] Updated item: ${JSON.stringify(updatedItem)}`);
      
      // Replace the item in the mock data
      const index = items.findIndex(item => item.id === filtered[0].id);
      if (index !== -1) {
        items[index] = updatedItem;
      }

      return createSuccessResponse<T>(updatedItem as unknown as T);
    }

    // For select operation
    const items = this.mockData[this.tableName] || [];
    console.log(`[MockQuery] Select single operation, total items: ${items.length}`);
    const filtered = this.applyFilters(items);
    console.log(`[MockQuery] Select single filtered items: ${filtered.length}`);
    
    if (filtered.length === 0) {
      console.log(`[MockQuery] Select single - no items found matching filters`);
      return createErrorResponse<T>({
        code: 'not_found',
        message: 'No data found',
        details: { tableName: this.tableName }
      });
    }

    console.log(`[MockQuery] Returning first filtered item: ${JSON.stringify(filtered[0])}`);
    return createSuccessResponse<T>(filtered[0] as unknown as T);
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    console.log(`[MockQuery] Executing maybeSingle() for operation ${this.operation}`);
    console.log(`[MockQuery] Current table: ${this.tableName}, filters count: ${this.filters.length}`);
    
    // Check if there's a mock response for this specific operation
    const mockResponseKey = `${this.operation}_maybeSingle`;
    if (this.mockResponses[mockResponseKey]) {
      return this.mockResponses[mockResponseKey];
    }

    // Otherwise, process based on filters
    const items = this.mockData[this.tableName] || [];
    console.log(`[MockQuery] maybeSingle total items: ${items.length}`);
    const filtered = this.applyFilters(items);
    console.log(`[MockQuery] maybeSingle filtered items: ${filtered.length}`);
    
    if (filtered.length === 0) {
      console.log(`[MockQuery] maybeSingle - no items found matching filters`);
      return createSuccessResponse<T | null>(null);
    }

    console.log(`[MockQuery] maybeSingle returning first filtered item: ${JSON.stringify(filtered[0])}`);
    return createSuccessResponse<T | null>(filtered[0] as unknown as T);
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    console.log(`[MockQuery] Executing execute() for operation ${this.operation}`);
    console.log(`[MockQuery] Current table: ${this.tableName}, filters count: ${this.filters.length}`);
    
    // Check if there's a mock response for this operation
    if (this.mockResponses[this.operation]) {
      console.log(`[MockQuery] Using mock response for operation ${this.operation}`);
      return this.mockResponses[this.operation];
    }

    // Otherwise, process based on operation
    if (this.operation === 'delete') {
      const items = this.mockData[this.tableName] || [];
      console.log(`[MockQuery] Delete operation, total items before: ${items.length}`);
      
      const filtered = this.applyFilters(items, true);
      console.log(`[MockQuery] Delete filtered items to remove: ${filtered.length}`);
      
      // Use 'in' condition for batch delete if present
      let itemsToDelete = filtered;
      if (this.inConditions.length > 0) {
        const inCondition = this.inConditions[0]; // Use first in condition
        itemsToDelete = items.filter(item => 
          inCondition.values.includes(item[inCondition.column])
        );
        console.log(`[MockQuery] Delete with 'in' condition, items to delete: ${itemsToDelete.length}`);
      }
      
      // Remove the deleted items from the mock data
      const remaining = items.filter(item => 
        !itemsToDelete.some(f => f.id === item.id)
      );
      
      this.mockData[this.tableName] = remaining;
      console.log(`[MockQuery] Delete operation complete, remaining items: ${remaining.length}`);
      
      return createSuccessResponse<T[]>([] as unknown as T[]);
    }
    
    if (this.operation === 'update' && this.inConditions.length > 0) {
      // Handle batch update with 'in' condition
      const items = this.mockData[this.tableName] || [];
      console.log(`[MockQuery] Batch update operation, total items: ${items.length}`);
      
      const inCondition = this.inConditions[0]; // Use first in condition
      
      // Find items to update
      const itemsToUpdate = items.filter(item => 
        inCondition.values.includes(item[inCondition.column])
      );
      
      console.log(`[MockQuery] Batch update items to update: ${itemsToUpdate.length}`);
      
      // Apply update to each item
      const updatedItems = [];
      for (const item of itemsToUpdate) {
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const updatedItem = { ...item, ...this.operationData };
          items[index] = updatedItem;
          updatedItems.push(updatedItem);
        }
      }
      
      console.log(`[MockQuery] Batch update completed, updated items: ${updatedItems.length}`);
      
      return createSuccessResponse<T[]>(updatedItems as unknown as T[]);
    }

    // For select operation
    const items = this.mockData[this.tableName] || [];
    console.log(`[MockQuery] Select operation, total items: ${items.length}`);
    
    // Apply filters - default to always true (don't preserve order)
    let result = this.applyFilters(items, false);
    console.log(`[MockQuery] Select filtered items: ${result.length}`);
    
    // Apply sorting if configured
    if (this.sortConfig) {
      result = this.applySort(result);
      console.log(`[MockQuery] Items after sorting: ${result.length}`);
    }
    
    // Apply pagination
    result = this.applyPagination(result);
    console.log(`[MockQuery] Final result after pagination: ${result.length}`);
    
    return createSuccessResponse<T[]>(result as unknown as T[]);
  }

  private applyFilters(items: any[], preserveOrder: boolean = false): any[] {
    console.log(`[applyFilters] Starting with ${items.length} items, preserveOrder=${preserveOrder}`);
    console.log(`[applyFilters] Number of filters: ${this.filters.length}`);
    console.log(`[applyFilters] Number of inConditions: ${this.inConditions.length}`);
    
    if (this.filters.length === 0 && this.inConditions.length === 0) {
      console.log(`[applyFilters] No filters, returning all items`);
      return [...items];
    }
    
    // Create a map to track the original indices for order preservation
    const originalOrder: Record<string, number> = {};
    if (preserveOrder) {
      items.forEach((item, index) => {
        // Use a combination of ID and index to ensure uniqueness
        const key = item.id ? `${item.id}-${index}` : `item-${index}`;
        originalOrder[key] = index;
      });
      console.log(`[applyFilters] Created original order map`);
    }
    
    let result = [...items];
    
    // Apply normal filters
    if (this.filters.length > 0) {
      console.log(`[applyFilters] Applying ${this.filters.length} filters`);
      
      // Debug each item against each filter for troubleshooting
      if (this.filters.length > 0 && items.length > 0) {
        console.log(`[applyFilters] First item before filtering: ${JSON.stringify(items[0])}`);
        this.filters.forEach((filter, index) => {
          console.log(`[applyFilters] Filter ${index} result on first item: ${filter(items[0])}`);
        });
      }
      
      result = result.filter(item => {
        const passes = this.filters.every(filter => filter(item));
        return passes;
      });
      
      console.log(`[applyFilters] After applying filters: ${result.length} items`);
    }
    
    // Apply 'in' conditions
    if (this.inConditions.length > 0) {
      for (const condition of this.inConditions) {
        console.log(`[applyFilters] Applying 'in' condition for ${condition.column} with ${condition.values.length} values`);
        result = result.filter(item => 
          condition.values.includes(item[condition.column])
        );
      }
      console.log(`[applyFilters] After applying 'in' conditions: ${result.length} items`);
    }
    
    // Restore original order if needed
    if (preserveOrder && result.length > 0) {
      console.log(`[applyFilters] Restoring original order`);
      result.sort((a, b) => {
        const keyA = a.id ? `${a.id}-${items.findIndex(item => item.id === a.id)}` : '';
        const keyB = b.id ? `${b.id}-${items.findIndex(item => item.id === b.id)}` : '';
        return (originalOrder[keyA] || 0) - (originalOrder[keyB] || 0);
      });
    }
    
    if (result.length > 0) {
      console.log(`[applyFilters] First item in result: ${JSON.stringify(result[0])}`);
    }
    
    return result;
  }

  private applySort(items: any[]): any[] {
    if (!this.sortConfig) return items;
    
    const { column, ascending } = this.sortConfig;
    return [...items].sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1;
      if (a[column] > b[column]) return ascending ? 1 : -1;
      return 0;
    });
  }

  private applyPagination(items: any[]): any[] {
    if (this.rangeValues) {
      const [from, to] = this.rangeValues;
      return items.slice(from, to + 1);
    }
    
    // Apply offset if set
    let result = items;
    if (this.offsetValue) {
      result = result.slice(this.offsetValue);
    }
    
    // Then apply limit if set
    if (this.limitValue) {
      result = result.slice(0, this.limitValue);
    }
    
    return result;
  }
}

/**
 * Create a mock repository for testing
 */
export function createMockRepository<T>(
  tableName: string, 
  initialData: T[] = []
): BaseRepository<T> {
  return new MockRepository<T>(tableName, initialData);
}
