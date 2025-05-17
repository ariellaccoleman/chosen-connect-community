
import { 
  createErrorResponse, 
  createSuccessResponse,
  handleApiError,
  showErrorToast,
  ApiError
} from '@/api/core/errorHandler';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorUtils';

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

describe('API Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createSuccessResponse returns properly formatted success response', () => {
    const testData = { id: '123', name: 'Test User' };
    const response = createSuccessResponse(testData);
    
    expect(response).toEqual({
      data: testData,
      error: null,
      status: 'success'
    });
  });

  test('createErrorResponse returns properly formatted error response', () => {
    const error = {
      code: 'auth/invalid_credentials',
      message: 'Invalid email or password',
      details: { attemptCount: 3 }
    };
    
    const response = createErrorResponse(error);
    
    expect(response).toEqual({
      data: null,
      error: {
        code: 'auth/invalid_credentials',
        message: 'Invalid email or password',
        details: { attemptCount: 3 },
        original: error
      },
      status: 'error'
    });
  });

  test('handleApiError handles PostgrestError', () => {
    const pgError = { 
      code: 'P0001', 
      message: 'Database error',
      details: 'Constraint violation'
    };
    
    const response = handleApiError(pgError);
    
    expect(response.status).toBe('error');
    expect(response.error?.code).toBe('P0001');
    expect(response.error?.message).toBe('Database error');
    expect(response.error?.details).toBe('Constraint violation');
  });

  test('handleApiError handles regular Error objects', () => {
    const error = new Error('Something went wrong');
    const response = handleApiError(error);
    
    expect(response.status).toBe('error');
    expect(response.error?.message).toBe('Something went wrong');
  });

  test('handleApiError handles unknown errors', () => {
    const response = handleApiError('Unexpected string error');
    
    expect(response.status).toBe('error');
    expect(response.error?.message).toBe('Unexpected string error');
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

  test('extractErrorMessage handles various error formats', () => {
    expect(extractErrorMessage({ message: 'Test error' })).toBe('Test error');
    expect(extractErrorMessage('String error')).toBe('String error');
    expect(extractErrorMessage({ error: { message: 'Nested error' } })).toBe('Nested error');
    expect(extractErrorMessage(null)).toBe('Unknown error occurred');
    expect(extractErrorMessage(undefined)).toBe('Unknown error occurred');
  });
});
