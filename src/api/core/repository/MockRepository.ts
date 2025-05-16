
import { DataRepository, RepositoryQuery, RepositoryResponse } from './DataRepository';

/**
 * Mock implementation of the DataRepository interface for testing
 */
export class MockRepository<T = any> implements DataRepository<T> {
  tableName: string;
  private mockData: Record<string, any[]> = {};
  private mockResponses: Record<string, any> = {};
  private lastOperation: string | null = null;
  private lastData: any = null;
  private filters: any[] = [];
  private inConditions: { column: string; values: any[] }[] = [];
  
  constructor(tableName: string, initialData: T[] = []) {
    this.tableName = tableName;
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
   * Create a select query
   */
  select(_selectQuery = '*'): RepositoryQuery<T> {
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
  insert(data: any): RepositoryQuery<T> {
    this.lastOperation = 'insert';
    this.lastData = data;
    this.resetFilters();
    
    // Auto-update mock data if no specific mock response is set
    if (!this.mockResponses[this.lastOperation]) {
      // Handle both single items and arrays
      const dataArray = Array.isArray(data) ? data : [data];
      
      const newItems = dataArray.map(item => ({
        id: `mock-id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
  update(data: any): RepositoryQuery<T> {
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
      return {
        data: { id: `mock-id-${Date.now()}`, ...this.operationData } as unknown as T,
        error: null
      };
    }

    if (this.operation === 'update') {
      // Find the first item that matches all filters
      const items = this.mockData[this.tableName] || [];
      const filtered = this.applyFilters(items);
      
      if (filtered.length === 0) {
        return { data: null, error: new Error('Item not found') };
      }

      // Update the first matching item
      const updatedItem = { ...filtered[0], ...this.operationData };
      
      // Replace the item in the mock data
      const index = items.findIndex(item => item.id === filtered[0].id);
      if (index !== -1) {
        items[index] = updatedItem;
      }

      return { data: updatedItem as unknown as T, error: null };
    }

    // For select operation
    const items = this.mockData[this.tableName] || [];
    const filtered = this.applyFilters(items);
    
    if (filtered.length === 0) {
      return { data: null, error: new Error('No data found') };
    }

    return { data: filtered[0] as unknown as T, error: null };
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
      return { data: null, error: null };
    }

    return { data: filtered[0] as unknown as T, error: null };
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
      return { data: [], error: null };
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
      
      return { data: itemsToUpdate as unknown as T[], error: null };
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
    
    return { data: result as unknown as T[], error: null };
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
    
    if (this.limitValue) {
      return items.slice(0, this.limitValue);
    }
    
    return items;
  }
}

/**
 * Create a mock repository for testing
 */
export function createMockRepository<T>(
  tableName: string, 
  initialData: T[] = []
): MockRepository<T> {
  return new MockRepository<T>(tableName, initialData);
}
