
/**
 * Utilities for mocking Supabase client in tests
 */

import { ApiResponse } from '@/api/core/types';
import { createSuccessResponse } from '@/api/core/errorHandler';

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
 * Tests batch operations with consistent testing API
 */
export function testCreateBatchOperations<T>(entityName: string, tableName: string, mockClient: any): void {
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
}
