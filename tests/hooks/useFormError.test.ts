
import { renderHook, act } from '@testing-library/react';
import { useFormError } from '@/hooks/useFormError';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/api/core/errorHandler';

// Mock the toast component
jest.mock('@/hooks/use-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

describe('useFormError Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state has null error', () => {
    const { result } = renderHook(() => useFormError());
    
    expect(result.current.error).toBeNull();
  });

  test('handleError sets error message and shows toast for standard Error', () => {
    const { result } = renderHook(() => useFormError());
    const testError = new Error('Test error message');
    
    act(() => {
      result.current.handleError(testError);
    });
    
    expect(result.current.error).toBe('Test error message');
    expect(toast.error).toHaveBeenCalledWith('Test error message');
  });

  test('handleError handles ApiError type correctly', () => {
    const { result } = renderHook(() => useFormError());
    const apiError = {
      code: 'validation_error',
      message: 'Validation failed'
    };
    
    act(() => {
      result.current.handleError(apiError);
    });
    
    expect(result.current.error).toBe('Validation failed');
    expect(toast.error).toHaveBeenCalledWith('Validation failed');
  });

  test('handleError handles unknown error types', () => {
    const { result } = renderHook(() => useFormError());
    
    act(() => {
      result.current.handleError('Something went wrong');
    });
    
    expect(result.current.error).toBe('An unexpected error occurred. Please try again.');
    expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred. Please try again.');
  });

  test('clearError resets the error state to null', () => {
    const { result } = renderHook(() => useFormError());
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });
    
    expect(result.current.error).toBeTruthy();
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  test('handleError returns the error message', () => {
    const { result } = renderHook(() => useFormError());
    
    let returnedMessage: string;
    
    act(() => {
      returnedMessage = result.current.handleError(new Error('Test error message'));
    });
    
    expect(returnedMessage).toBe('Test error message');
  });
});
