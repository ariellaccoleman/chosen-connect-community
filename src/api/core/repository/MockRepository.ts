
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
   * Create a select query
   */
  select(_selectQuery = '*'): RepositoryQuery<T> {
    this.lastOperation = 'select';
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation
    );
  }

  /**
   * Create an insert query
   */
  insert(data: any): RepositoryQuery<T> {
    this.lastOperation = 'insert';
    this.lastData = data;
    
    // Auto-update mock data if no specific mock response is set
    if (!this.mockResponses[this.lastOperation]) {
      const newItem = { 
        id: `mock-id-${Date.now()}`,
        ...data
      };
      this.mockData[this.tableName] = [...(this.mockData[this.tableName] || []), newItem];
    }
    
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.lastData
    );
  }

  /**
   * Create an update query
   */
  update(data: any): RepositoryQuery<T> {
    this.lastOperation = 'update';
    this.lastData = data;
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation,
      this.lastData
    );
  }

  /**
   * Create a delete query
   */
  delete(): RepositoryQuery<T> {
    this.lastOperation = 'delete';
    return new MockQuery<T>(
      this.tableName,
      this.mockData,
      this.mockResponses,
      this.lastOperation
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
  private filters: Array<(item: any) => boolean> = [];
  private sortConfig: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private rangeValues: [number, number] | null = null;
  private selectFields: string = '*';

  constructor(
    tableName: string,
    mockData: Record<string, any[]>,
    mockResponses: Record<string, any>,
    operation: string,
    operationData?: any
  ) {
    this.tableName = tableName;
    this.mockData = mockData;
    this.mockResponses = mockResponses;
    this.operation = operation;
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
      const remaining = items.filter(item => 
        !filtered.some(f => f.id === item.id)
      );
      
      this.mockData[this.tableName] = remaining;
      return { data: [], error: null };
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
    if (this.filters.length === 0) {
      return [...items];
    }
    
    return items.filter(item => 
      this.filters.every(filter => filter(item))
    );
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
