import { DataRepository, QueryFilter, RepositoryResponse } from './DataRepository';
import { BaseRepository } from './BaseRepository';
import { logger } from '@/utils/logger';

/**
 * Repository implementation that uses in-memory data for testing
 */
export class MockRepository<T = any> implements DataRepository<T>, BaseRepository<T> {
  /**
   * In-memory data store mapped by table name
   */
  private mockData: Record<string, any[]> = {};
  
  /**
   * Current query filters
   */
  private filters: QueryFilter[] = [];
  
  /**
   * Mock responses for specific operations to override default behavior
   */
  private mockResponses: Record<string, any> = {};
  
  /**
   * Current selection fields
   */
  private selectionFields: string = '*';
  
  /**
   * Current ordering configuration
   */
  private orderField: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  
  /**
   * Current limit and offset values
   */
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  
  /**
   * Flag indicating if this is a count query
   */
  private isCountQuery: boolean = false;
  
  /**
   * If set, the query will check for a single result
   */
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;
  
  /**
   * Creates a new mock repository with initial data
   */
  constructor(
    private tableName: string,
    initialData: any[] = []
  ) {
    if (!tableName) {
      throw new Error('A table name must be provided to create a mock repository');
    }
    
    // Initialize data for the specified table
    this.mockData[tableName] = [...initialData];
    
    logger.debug(`MockRepository for '${tableName}' created with ${initialData.length} items`);
  }
  
  /**
   * Set a mock response for a specific operation
   */
  setMockResponse(operation: string, response: any) {
    this.mockResponses[operation] = response;
  }
  
  /**
   * Reset all mock responses
   */
  resetMockResponses() {
    this.mockResponses = {};
  }
  
  /**
   * Create a valid repository response object
   */
  private createResponse<R>(data: R, error: any = null): RepositoryResponse<R> {
    return {
      data,
      error,
      isSuccess: () => !error,
      isError: () => !!error,
      getErrorMessage: () => error ? (error.message || String(error)) : null
    };
  }
  
  /**
   * Reset query state
   */
  private resetQueryState() {
    this.filters = [];
    this.selectionFields = '*';
    this.orderField = null;
    this.orderDirection = 'asc';
    this.limitValue = null;
    this.offsetValue = null;
    this.isCountQuery = false;
    this.singleResult = false;
    this.maybeSingleResult = false;
  }
  
  /**
   * Apply filters to data
   */
  private applyFilters(data: any[]): any[] {
    // Return all data if no filters
    if (!this.filters.length) return [...data];
    
    // Apply each filter
    return data.filter(item => {
      // Item must match all filters
      return this.filters.every(filter => {
        const { field, operator, value } = filter;
        
        switch (operator) {
          case 'eq':
            return item[field] === value;
          case 'neq':
            return item[field] !== value;
          case 'gt':
            return item[field] > value;
          case 'gte':
            return item[field] >= value;
          case 'lt':
            return item[field] < value;
          case 'lte':
            return item[field] <= value;
          case 'like':
            return typeof item[field] === 'string' && 
              item[field].toLowerCase().includes(String(value).toLowerCase());
          case 'ilike':
            return typeof item[field] === 'string' && 
              item[field].toLowerCase().includes(String(value).toLowerCase());
          case 'in':
            return Array.isArray(value) && value.includes(item[field]);
          default:
            return true;
        }
      });
    });
  }
  
  /**
   * Apply ordering to data
   */
  private applyOrdering(data: any[]): any[] {
    if (!this.orderField) return data;
    
    return [...data].sort((a, b) => {
      const valueA = a[this.orderField!];
      const valueB = b[this.orderField!];
      
      // Handle null/undefined values
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return this.orderDirection === 'asc' ? -1 : 1;
      if (valueB == null) return this.orderDirection === 'asc' ? 1 : -1;
      
      // Compare based on types
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.orderDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.orderDirection === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
      
      // Default comparison for mixed types
      const stringA = String(valueA);
      const stringB = String(valueB);
      return this.orderDirection === 'asc'
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  }
  
  /**
   * Apply pagination to data
   */
  private applyPagination(data: any[]): any[] {
    let result = data;
    
    if (this.offsetValue !== null) {
      result = result.slice(this.offsetValue);
    }
    
    if (this.limitValue !== null) {
      result = result.slice(0, this.limitValue);
    }
    
    return result;
  }
  
  /**
   * Apply field selection to data
   */
  private applySelection(data: any[]): any[] {
    if (this.selectionFields === '*') return data;
    
    const fields = this.selectionFields.split(',').map(f => f.trim());
    return data.map(item => {
      const result: Record<string, any> = {};
      fields.forEach(field => {
        if (field in item) {
          result[field] = item[field];
        }
      });
      return result;
    });
  }
  
  /**
   * Process the query and return results
   */
  private processQuery<R = any>(): RepositoryResponse<R> {
    try {
      // Get data for the table
      const tableData = this.mockData[this.tableName] || [];
      
      // Apply filters
      let result = this.applyFilters(tableData);
      
      // Apply ordering if not a count query
      if (!this.isCountQuery) {
        result = this.applyOrdering(result);
      }
      
      // Apply pagination
      result = this.applyPagination(result);
      
      // If this is a count query, return the count
      if (this.isCountQuery) {
        return this.createResponse<R>(result.length as any);
      }
      
      // Apply field selection
      result = this.applySelection(result);
      
      // Handle single result queries
      if (this.singleResult) {
        if (result.length === 0) {
          return this.createResponse<R>(null as any, new Error('No rows found'));
        }
        if (result.length > 1) {
          return this.createResponse<R>(null as any, new Error('Multiple rows returned'));
        }
        return this.createResponse<R>(result[0] as any);
      }
      
      // Handle maybe single result queries
      if (this.maybeSingleResult) {
        if (result.length === 0) {
          return this.createResponse<R>(null as any);
        }
        return this.createResponse<R>(result[0] as any);
      }
      
      // Return all results
      return this.createResponse<R>(result as any);
    } catch (error) {
      return this.createResponse<R>(null as any, error);
    } finally {
      this.resetQueryState();
    }
  }

  /**
   * Start a select query
   */
  select(columns: string = '*'): DataRepository<T> {
    // Check for mock response
    if (this.mockResponses['select']) {
      return this;
    }
    
    // Set selection fields
    this.selectionFields = columns;
    return this;
  }
  
  /**
   * Add an equality filter
   */
  eq(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'eq', value });
    return this;
  }
  
  /**
   * Add a not-equal filter
   */
  neq(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'neq', value });
    return this;
  }
  
  /**
   * Add a greater-than filter
   */
  gt(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'gt', value });
    return this;
  }
  
  /**
   * Add a greater-than-or-equal filter
   */
  gte(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'gte', value });
    return this;
  }
  
  /**
   * Add a less-than filter
   */
  lt(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'lt', value });
    return this;
  }
  
  /**
   * Add a less-than-or-equal filter
   */
  lte(field: string, value: any): DataRepository<T> {
    this.filters.push({ field, operator: 'lte', value });
    return this;
  }
  
  /**
   * Add a like filter (case-insensitive)
   */
  like(field: string, value: string): DataRepository<T> {
    this.filters.push({ field, operator: 'like', value });
    return this;
  }
  
  /**
   * Add a case-insensitive like filter
   */
  ilike(field: string, value: string): DataRepository<T> {
    this.filters.push({ field, operator: 'ilike', value });
    return this;
  }
  
  /**
   * Add an in filter
   */
  in(field: string, values: any[]): DataRepository<T> {
    this.filters.push({ field, operator: 'in', value: values });
    return this;
  }
  
  /**
   * Set ordering
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): DataRepository<T> {
    this.orderField = field;
    this.orderDirection = direction;
    return this;
  }
  
  /**
   * Set result limit
   */
  limit(count: number): DataRepository<T> {
    this.limitValue = count;
    return this;
  }
  
  /**
   * Set result offset
   */
  offset(count: number): DataRepository<T> {
    this.offsetValue = count;
    return this;
  }
  
  /**
   * Get a single result
   */
  single<R = T>(): RepositoryResponse<R> {
    // Check for mock response
    if (this.mockResponses['single']) {
      return this.mockResponses['single'];
    }
    
    this.singleResult = true;
    return this.processQuery<R>();
  }
  
  /**
   * Get a single result or null
   */
  maybeSingle<R = T>(): RepositoryResponse<R | null> {
    // Check for mock response
    if (this.mockResponses['maybeSingle']) {
      return this.mockResponses['maybeSingle'];
    }
    
    this.maybeSingleResult = true;
    return this.processQuery<R | null>();
  }
  
  /**
   * Count the number of results
   */
  count(): RepositoryResponse<number> {
    // Check for mock response
    if (this.mockResponses['count']) {
      return this.mockResponses['count'];
    }
    
    this.isCountQuery = true;
    return this.processQuery<number>();
  }
  
  /**
   * Execute the query
   */
  execute<R = T[]>(): RepositoryResponse<R> {
    // Check for mock response
    if (this.mockResponses['execute']) {
      return this.mockResponses['execute'];
    }
    
    return this.processQuery<R>();
  }
  
  /**
   * Insert new data
   */
  insert(values: Record<string, any> | Record<string, any>[]): DataRepository<T> {
    // Check for mock response
    if (this.mockResponses['insert']) {
      return this;
    }
    
    // Ensure the table exists
    if (!this.mockData[this.tableName]) {
      this.mockData[this.tableName] = [];
    }
    
    return this;
  }
  
  /**
   * Update existing data
   */
  update(values: Record<string, any>): DataRepository<T> {
    // Check for mock response
    if (this.mockResponses['update']) {
      return this;
    }
    
    return this;
  }
  
  /**
   * Delete data
   */
  delete(): DataRepository<T> {
    // Check for mock response
    if (this.mockResponses['delete']) {
      return this;
    }
    
    return this;
  }
  
  /**
   * Retrieve entity by ID
   */
  async getById(id: string | number): Promise<T | null> {
    // Check for mock response
    if (this.mockResponses['getById']) {
      return this.mockResponses['getById'];
    }
    
    const result = await this.select()
      .eq('id', id)
      .maybeSingle<T>();
      
    return result.data;
  }
  
  /**
   * Retrieve all entities
   */
  async getAll(): Promise<T[]> {
    // Check for mock response
    if (this.mockResponses['getAll']) {
      return this.mockResponses['getAll'];
    }
    
    const result = await this.select().execute<T[]>();
    return result.data || [];
  }
  
  /**
   * Execute a method that returns a Promise
   */
  async exec<R = T[]>(): Promise<RepositoryResponse<R>> {
    // Allow for mocking async operations
    if (this.mockResponses['exec']) {
      return this.mockResponses['exec'];
    }
    
    return this.processQuery<R>();
  }
}

/**
 * Creates a mock repository for the given table name with optional initial data
 */
export function createMockRepository<T = any>(
  tableName: string, 
  initialData: T[] = []
): DataRepository<T> & BaseRepository<T> {
  return new MockRepository<T>(tableName, initialData);
}

// Fix the MockRepository implementation to correctly handle each operation
// Adding proper fix for the delete operation

// Patch the prototype to correctly implement required operations
const originalInsertExecute = MockRepository.prototype.execute;

MockRepository.prototype.execute = function<R = any>() {
  // If this is an insert operation
  if (this.filters.length === 0 && this.mockResponses['insert']) {
    return this.mockResponses['insert'];
  }
  
  // If this is a delete operation 
  if (this.mockResponses['delete']) {
    // Apply our filters to identify items to delete
    const tableData = this.mockData[this.tableName] || [];
    const filteredData = this.applyFilters(tableData);
    
    // Remove matching items from the original array
    if (filteredData.length > 0) {
      // Find indices of items to remove
      const idsToRemove = filteredData.map(item => item.id);
      
      // Filter the array to keep only non-matching items
      this.mockData[this.tableName] = tableData.filter(item => 
        !idsToRemove.includes(item.id)
      );
      
      console.log(`[MockRepository.delete] Removed ${filteredData.length} items, ${this.mockData[this.tableName].length} remaining`);
      
      return this.createResponse(filteredData);
    }
    
    return this.createResponse([]);
  }
  
  // If this is an update operation
  if (this.mockResponses['update']) {
    return this.mockResponses['update'];
  }
  
  return originalInsertExecute.call(this);
};

// Implement the insert, update, and delete operations to modify the mockData

const originalInsert = MockRepository.prototype.insert;

MockRepository.prototype.insert = function(values) {
  // Clone the base functionality
  const result = originalInsert.call(this, values);
  
  // Add actual insert implementation
  const dataToInsert = Array.isArray(values) ? values : [values];
  
  // Generate IDs if not provided
  const processedData = dataToInsert.map(item => {
    if (!item.id) {
      return { ...item, id: `mock-${Math.random().toString(36).substring(2, 11)}` };
    }
    return { ...item };
  });
  
  // Add to mock data
  this.mockData[this.tableName].push(...processedData);
  
  // Set mock response for execute
  this.mockResponses['insert'] = this.createResponse(
    processedData.length === 1 ? processedData[0] : processedData
  );
  
  console.log(`[MockRepository.insert] Added ${processedData.length} items, total now: ${this.mockData[this.tableName].length}`);
  
  return result;
};

const originalUpdate = MockRepository.prototype.update;

MockRepository.prototype.update = function(values) {
  // Clone the base functionality
  const result = originalUpdate.call(this, values);
  
  // Store filters for use in execute
  const currentFilters = [...this.filters];
  
  // Set mock response for execute to handle update logic
  this.mockResponses['update'] = (() => {
    // Apply filters to find items to update
    const tableData = this.mockData[this.tableName] || [];
    
    // Save filters and reset them temporarily
    const savedFilters = this.filters;
    this.filters = currentFilters;
    
    // Apply filters to get items to update
    const itemsToUpdate = this.applyFilters(tableData);
    
    // Restore filters
    this.filters = savedFilters;
    
    if (itemsToUpdate.length === 0) {
      return this.createResponse(null, new Error('No matching record found for update'));
    }
    
    // Update the items and collect updated versions
    const updatedItems = itemsToUpdate.map(item => {
      // Find the item in the original array
      const index = tableData.findIndex(i => i.id === item.id);
      if (index >= 0) {
        // Update the item in the original array
        const updatedItem = { ...item, ...values };
        this.mockData[this.tableName][index] = updatedItem;
        return updatedItem;
      }
      return item;
    });
    
    console.log(`[MockRepository.update] Updated ${updatedItems.length} items`);
    
    return this.createResponse(
      updatedItems.length === 1 ? updatedItems[0] : updatedItems
    );
  })();
  
  return result;
};

const originalDelete = MockRepository.prototype.delete;

MockRepository.prototype.delete = function() {
  // Clone the base functionality
  const result = originalDelete.call(this);
  
  // Store filters for use in execute
  const currentFilters = [...this.filters];
  
  // Set mock response for delete
  this.mockResponses['delete'] = true;
  
  // Store filters for deletion during execute
  this.filters = currentFilters;
  
  return result;
};
