
import { ApiResponse, ApiError } from '@/api/core/errorHandler';

/**
 * Create a mock success API response
 */
export function createMockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    status: 'success'
  };
}

/**
 * Create a mock error API response
 */
export function createMockApiError(code: string, message: string, details?: unknown): ApiResponse<null> {
  const error: ApiError = {
    code,
    message,
    details
  };
  
  return {
    data: null,
    error,
    status: 'error'
  };
}

/**
 * Helper to wait for promises in tests
 */
export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Mock toast functions for testing
 */
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
};

// Mock the UI toast component
jest.mock('@/components/ui/sonner', () => ({
  toast: mockToast
}));
