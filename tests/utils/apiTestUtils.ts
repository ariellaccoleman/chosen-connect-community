
import { ApiResponse } from "@/api/core/errorHandler";
import { mockSupabase } from "../__mocks__/supabase";

/**
 * Helper function to set up the mockSupabase with desired response
 */
export function setupMockQueryResponse<T>(response: T | null, error: any = null) {
  mockSupabase.from.mockImplementation(function() {
    return this;
  });
  
  mockSupabase.select.mockImplementation(function() {
    return this;
  });
  
  mockSupabase.eq.mockImplementation(function() {
    return this;
  });
  
  mockSupabase.order.mockImplementation(function() {
    return this;
  });
  
  mockSupabase.maybeSingle.mockImplementation(() => {
    return Promise.resolve({
      data: response,
      error: error
    });
  });
  
  mockSupabase.single.mockImplementation(() => {
    return Promise.resolve({
      data: response,
      error: error
    });
  });
  
  mockSupabase.then.mockImplementation((callback) => {
    return Promise.resolve({
      data: Array.isArray(response) ? response : [response],
      error: error
    }).then(callback);
  });
  
  return mockSupabase;
}

/**
 * Helper function to simulate a successful API response
 */
export function mockSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    status: 'success'
  };
}

/**
 * Helper function to simulate an error API response
 */
export function mockErrorResponse(message: string, code = 'ERROR'): ApiResponse<any> {
  return {
    data: null,
    error: { message, code },
    status: 'error'
  };
}

/**
 * Setup a mock for database mutations (insert, update, delete)
 */
export function setupMockMutationResponse<T>(response: T | null, error: any = null) {
  mockSupabase.from.mockImplementation(function() {
    return this;
  });
  
  const mockResponseObj = {
    data: response,
    error: error
  };
  
  mockSupabase.insert.mockImplementation(function() {
    return {
      select: jest.fn().mockResolvedValue(mockResponseObj),
      single: jest.fn().mockResolvedValue(mockResponseObj),
      then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
    };
  });
  
  mockSupabase.update.mockImplementation(function() {
    return {
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResponseObj),
        then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
      }),
      match: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResponseObj),
        then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
      }),
      in: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResponseObj),
        then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
      }),
      then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
    };
  });
  
  mockSupabase.delete.mockImplementation(function() {
    return {
      eq: jest.fn().mockResolvedValue(mockResponseObj),
      in: jest.fn().mockResolvedValue(mockResponseObj),
      match: jest.fn().mockResolvedValue(mockResponseObj),
      then: jest.fn(cb => Promise.resolve(mockResponseObj).then(cb))
    };
  });
  
  return mockSupabase;
}
