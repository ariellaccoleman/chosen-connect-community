
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
  
  mockSupabase.maybeSingle.mockResolvedValue({
    data: response,
    error: error
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
