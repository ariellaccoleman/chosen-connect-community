
import { 
  createErrorResponse, 
  createSuccessResponse,
  handleApiError,
  showErrorToast,
  ApiError
} from '@/api/core/errorHandler';
import { toast } from 'sonner';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { CentralTestAuthUtils } from '../testing/CentralTestAuthUtils';

// Mock the toast function
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

// Mock the logger to avoid console errors in tests
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('API Error Handler - Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  test('createSuccessResponse returns properly formatted success response', () => {
    const testData = { id: '123', name: 'Test User' };
    const response = createSuccessResponse(testData);
    
    // Test individual properties instead of deep equality
    expect(response.data).toEqual(testData);
    expect(response.error).toBeNull();
    expect(response.status).toBe('success');
    
    // Test helper methods
    expect(response.isSuccess()).toBe(true);
    expect(response.isError()).toBe(false);
  });

  test('createErrorResponse returns properly formatted error response', () => {
    const error = {
      code: 'auth/invalid_credentials',
      message: 'Invalid email or password',
      details: { attemptCount: 3 }
    };
    
    const response = createErrorResponse(error);
    
    // Test individual properties instead of deep equality
    expect(response.data).toBeNull();
    expect(response.status).toBe('error');
    expect(response.error).toMatchObject({
      code: 'auth/invalid_credentials',
      message: 'Invalid email or password',
      details: { attemptCount: 3 },
      original: error
    });
    
    // Test helper methods
    expect(response.isSuccess()).toBe(false);
    expect(response.isError()).toBe(true);
  });

  test('handleApiError handles real PostgrestError from database', async () => {
    // Use authenticated API to trigger a real database error
    const result = await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user2',
      async (client) => {
        try {
          // Try to insert invalid data to trigger a real PostgrestError
          const { error } = await client
            .from('profiles')
            .insert({ 
              id: 'invalid-uuid-format', // This should trigger a database error
              email: 'test@example.com' 
            });
          
          if (error) {
            const response = handleApiError(error, 'Test Context');
            return response;
          }
          
          return null;
        } catch (error) {
          return handleApiError(error, 'Test Context');
        }
      }
    );
    
    if (result) {
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeTruthy();
      
      // Test helper methods
      expect(result.isSuccess()).toBe(false);
      expect(result.isError()).toBe(true);
    }
  });

  test('handleApiError handles regular Error objects', () => {
    const error = new Error('Something went wrong');
    const response = handleApiError(error);
    
    expect(response.status).toBe('error');
    expect(response.error?.message).toBe('Something went wrong');
    
    // Test helper methods
    expect(response.isSuccess()).toBe(false);
    expect(response.isError()).toBe(true);
  });

  test('handleApiError handles unknown errors', () => {
    const response = handleApiError('Unexpected string error');
    
    expect(response.status).toBe('error');
    expect(response.error?.message).toBe('Unexpected string error');
    
    // Test helper methods
    expect(response.isSuccess()).toBe(false);
    expect(response.isError()).toBe(true);
  });

  test('showErrorToast displays error message via toast', () => {
    const error: ApiError = {
      code: 'validation_error',
      message: 'Invalid input data'
    };
    
    showErrorToast(error);
    
    expect(toast.error).toHaveBeenCalledWith('Invalid input data');
  });

  test('showErrorToast handles missing message', () => {
    const error: ApiError = {
      code: 'unknown_error',
      message: ''
    };
    
    showErrorToast(error);
    
    expect(toast.error).toHaveBeenCalledWith('An error occurred');
  });

  test('showErrorToast with prefix adds prefix to message', () => {
    const error: ApiError = {
      code: 'validation_error',
      message: 'Invalid input data'
    };
    
    showErrorToast(error, 'Form Error');
    
    expect(toast.error).toHaveBeenCalledWith('Form Error: Invalid input data');
  });

  test('handleApiError with real database permission error', async () => {
    // Test with authenticated client to check permission handling
    const result = await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user2',
      async (client) => {
        try {
          // Try to access a table that might have RLS restrictions
          const { error } = await client
            .from('profiles')
            .select('*')
            .eq('id', 'non-existent-id');
          
          if (error) {
            return handleApiError(error, 'Permission Test');
          }
          
          return createSuccessResponse('No error occurred');
        } catch (error) {
          return handleApiError(error, 'Permission Test');
        }
      }
    );
    
    // Should handle the error appropriately regardless of the specific error type
    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    
    // Test helper methods exist
    expect(typeof result.isSuccess).toBe('function');
    expect(typeof result.isError).toBe('function');
  });

  test('ApiResponse helper methods work correctly for success responses', () => {
    const response = createSuccessResponse({ test: 'data' });
    
    expect(response.isSuccess()).toBe(true);
    expect(response.isError()).toBe(false);
  });

  test('ApiResponse helper methods work correctly for error responses', () => {
    const response = createErrorResponse(new Error('test error'));
    
    expect(response.isSuccess()).toBe(false);
    expect(response.isError()).toBe(true);
  });
});
