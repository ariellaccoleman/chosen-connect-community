/**
 * Utilities for mocking Supabase client in tests
 */

import { ApiResponse } from '@/api/core/types';
import { createSuccessResponse } from '@/api/core/errorHandler';
import { MockRepository } from '@/api/core/repository/MockRepository';

/**
 * Creates a chainable mock Supabase client that makes testing easier
 */
export function createChainableMock() {
  // Create a chainable mock
  const chainableMethods = [
    'from', 'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in',
    'order', 'range', 'limit', 'single', 'maybeSingle'
  ];
  
  const mock: any = {};
  
  // Create mock functions for all chainable methods
  chainableMethods.forEach(method => {
    mock[method] = jest.fn().mockReturnValue(mock);
  });
  
  // Add mock response functionality
  mock.mockResponseFor = (tableName: string, response: any) => {
    mock.from.mockImplementation((table: string) => {
      if (table === tableName) {
        return {
          ...mock,
          then: jest.fn().mockResolvedValue(response)
        };
      }
      return mock;
    });
  };
  
  // Add reset functionality
  mock.reset = () => {
    chainableMethods.forEach(method => {
      if (mock[method] && mock[method].mockClear) {
        mock[method].mockClear();
      }
    });
  };
  
  return mock;
}

/**
 * Creates a simple successful response for testing
 */
export function createSuccessResponse<T>(data: T): { data: T, error: null } {
  return { data, error: null };
}

/**
 * Creates a simple error response for testing
 */
export function createErrorResponse(message: string, code: string = 'ERROR'): { data: null, error: { message: string, code: string } } {
  return { data: null, error: { message, code } };
}

/**
 * Creates batch operations for testing with a consistent interface
 */
export function testCreateBatchOperations<T>(config: { 
  tableName: string, 
  clientFn: () => any 
}) {
  const { tableName, clientFn } = config;
  const mockClient = clientFn();
  
  // Return mock data for testing batch operations
  const mockData = [
    { id: 'batch-1', name: 'Batch Item 1' },
    { id: 'batch-2', name: 'Batch Item 2' }
  ];
  
  // Mock batch create
  mockClient.from.mockImplementation((name: string) => {
    if (name === tableName) {
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            then: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      };
    }
    return mockClient;
  });
  
  // Return the operations object
  return {
    batchCreate: jest.fn().mockResolvedValue({
      status: 'success',
      data: mockData
    }),
    batchUpdate: jest.fn().mockResolvedValue({
      status: 'success',
      data: true
    }),
    batchDelete: jest.fn().mockResolvedValue({
      status: 'success',
      data: true
    })
  };
}

/**
 * Creates mock batch operations using the repository pattern
 */
export function createMockBatchOperations<T>(
  entityName: string,
  tableName: string,
  options: {
    transformResponse?: (item: any) => T;
    transformRequest?: (item: any) => Record<string, any>;
    mockData?: any[];
    errorOn?: string;
  } = {}
) {
  // Create a mock repository
  const mockRepo = new MockRepository<T>(tableName, options.mockData || []);
  
  // Setup error if specified
  if (options.errorOn) {
    mockRepo.setMockResponse(options.errorOn, {
      data: null,
      error: new Error(`Mock error for ${options.errorOn} operation`)
    });
  }
  
  return {
    mockRepo,
    operations: {
      batchCreate: jest.fn().mockImplementation(async (items: any[]) => {
        if (options.errorOn === 'batchCreate') {
          throw new Error(`Mock error for batchCreate operation`);
        }
        
        const transformedItems = options.transformRequest 
          ? items.map(options.transformRequest)
          : items;
          
        const result = await mockRepo.insert(transformedItems as any).select().execute();
        
        if (result.error) {
          throw result.error;
        }
        
        const transformedData = options.transformResponse && result.data
          ? result.data.map(options.transformResponse)
          : result.data;
          
        return createSuccessResponse(transformedData);
      }),
      
      batchUpdate: jest.fn().mockImplementation(async (items: any[]) => {
        if (options.errorOn === 'batchUpdate') {
          throw new Error(`Mock error for batchUpdate operation`);
        }
        
        // Process each update independently in repository
        for (const item of items) {
          const { id, ...updateData } = item;
          const transformedData = options.transformRequest 
            ? options.transformRequest(updateData)
            : updateData;
          
          const update = {
            id,
            ...transformedData
          };
          
          const result = await mockRepo
            .update(update)
            .eq('id', id)
            .execute();
            
          if (result.error) {
            throw result.error;
          }
        }
        
        return createSuccessResponse(true);
      }),
      
      batchDelete: jest.fn().mockImplementation(async (ids: string[]) => {
        if (options.errorOn === 'batchDelete') {
          throw new Error(`Mock error for batchDelete operation`);
        }
        
        const result = await mockRepo
          .delete()
          .in('id', ids)
          .execute();
          
        if (result.error) {
          throw result.error;
        }
        
        return createSuccessResponse(true);
      })
    }
  };
}
