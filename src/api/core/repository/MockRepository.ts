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
        [this.options.idField]: `mock-id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
    this.filters.push(item => item[column] === value);
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
    // Check if there's a mock response for this specific operation
    const mockResponseKey = `${this.operation}_single`;
    if (this.mockResponses[mockResponseKey]) {
      return this.mockResponses[mockResponseKey];
    }

    // Otherwise, process based on operation
    if (this.operation === 'insert') {
      return createSuccessResponse<T>({ 
        id: `mock-id-${Date.now()}`, 
        ...this.operationData 
      } as unknown as T);
    }

    if (this.operation === 'update') {
      // Find the first item that matches all filters
      const items = this.mockData[this.tableName] || [];
      const filtered = this.applyFilters(items);
      
      if (filtered.length === 0) {
        return createErrorResponse<T>({
          code: 'not_found',
          message: 'Item not found',
          details: { tableName: this.tableName }
        });
      }

      // Update the first matching item
      const updatedItem = { ...filtered[0], ...this.operationData };
      
      // Replace the item in the mock data
      const index = items.findIndex(item => item.id === filtered[0].id);
      if (index !== -1) {
        items[index] = updatedItem;
      }

      return createSuccessResponse<T>(updatedItem as unknown as T);
    }

    // For select operation
    const items = this.mockData[this.tableName] || [];
    const filtered = this.applyFilters(items);
    
    if (filtered.length === 0) {
      return createErrorResponse<T>({
        code: 'not_found',
        message: 'No data found',
        details: { tableName: this.tableName }
      });
    }

    return createSuccessResponse<T>(filtered[0] as unknown as T);
  }

  async maybeSingle(): Promise<RepositoryResponse<T | null>> {
    // Check if there's a mock response for this specific operation
    const mockResponseKey = `${this.operation}_maybeSingle`;
    if (this.mockResponses[mockResponseKey]) {
      return this.mockResponses[mockResponseKey];
    }

    // Otherwise, process based on filters
    const items = this.mockData[this.tableName] || [];
    const filtered = this.applyFilters(items);
    
    if (filtered.length === 0) {
      return createSuccessResponse<T | null>(null);
    }

    return createSuccessResponse<T | null>(filtered[0] as unknown as T);
  }

  async execute(): Promise<RepositoryResponse<T[]>> {
    // Check if there's a mock response for this operation
    if (this.mockResponses[this.operation]) {
      return this.mockResponses[this.operation];
    }

    // Otherwise, process based on operation
    if (this.operation === 'delete') {
      const items = this.mockData[this.tableName] || [];
      const filtered = this.applyFilters(items);
      
      // Use 'in' condition for batch delete if present
      let itemsToDelete = filtered;
      if (this.inConditions.length > 0) {
        const inCondition = this.inConditions[0]; // Use first in condition
        itemsToDelete = items.filter(item => 
          inCondition.values.includes(item[inCondition.column])
        );
      }
      
      // Remove the deleted items from the mock data
      const remaining = items.filter(item => 
        !itemsToDelete.some(f => f.id === item.id)
      );
      
      this.mockData[this.tableName] = remaining;
      return createSuccessResponse<T[]>([] as unknown as T[]);
    }
    
    if (this.operation === 'update' && this.inConditions.length > 0) {
      // Handle batch update with 'in' condition
      const items = this.mockData[this.tableName] || [];
      const inCondition = this.inConditions[0]; // Use first in condition
      
      // Find items to update
      const itemsToUpdate = items.filter(item => 
        inCondition.values.includes(item[inCondition.column])
      );
      
      // Apply update to each item
      for (const item of itemsToUpdate) {
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          items[index] = { ...item, ...this.operationData };
        }
      }
      
      return createSuccessResponse<T[]>(itemsToUpdate as unknown as T[]);
    }

    // For select operation
    const items = this.mockData[this.tableName] || [];
    let result = this.applyFilters(items);
    
    // Apply sorting if configured
    if (this.sortConfig) {
      result = this.applySort(result);
    }
    
    // Apply pagination
    result = this.applyPagination(result);
    
    return createSuccessResponse<T[]>(result as unknown as T[]);
  }

  private applyFilters(items: any[]): any[] {
    if (this.filters.length === 0 && this.inConditions.length === 0) {
      return [...items];
    }
    
    let result = [...items];
    
    // Apply normal filters
    if (this.filters.length > 0) {
      result = result.filter(item => 
        this.filters.every(filter => filter(item))
      );
    }
    
    // Apply 'in' conditions
    if (this.inConditions.length > 0) {
      for (const condition of this.inConditions) {
        result = result.filter(item => 
          condition.values.includes(item[condition.column])
        );
      }
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
