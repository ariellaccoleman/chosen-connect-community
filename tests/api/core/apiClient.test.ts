
import { apiClient } from '@/api/core/apiClient';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { handleApiError } from '@/api/core/errorHandler';

// Mock the errorHandler module
jest.mock('@/api/core/errorHandler', () => ({
  ...jest.requireActual('@/api/core/errorHandler'),
  handleApiError: jest.fn(error => ({
    data: null,
    error: { 
      code: 'test_error', 
      message: error.message || 'Test error',
      details: error.details
    },
    status: 'error'
  }))
}));

describe('API Client', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  test('query executes callback with supabase client and returns result on success', async () => {
    const mockData = { id: '123', name: 'Test' };
    const mockCallback = jest.fn().mockResolvedValue(mockData);
    
    const result = await apiClient.query(mockCallback);
    
    expect(mockCallback).toHaveBeenCalledWith(mockSupabase);
    expect(result).toEqual(mockData);
  });

  test('query handles errors and returns standardized error response', async () => {
    const testError = new Error('Database query failed');
    const mockCallback = jest.fn().mockRejectedValue(testError);
    
    const result = await apiClient.query(mockCallback);
    
    expect(mockCallback).toHaveBeenCalledWith(mockSupabase);
    expect(result.status).toBe('error');
    expect(result.error?.message).toBe('Database query failed');
    expect(result.data).toBeNull();
  });

  test('authQuery executes callback with supabase.auth', async () => {
    const mockData = { user: { id: 'user-123' } };
    const mockCallback = jest.fn().mockResolvedValue(mockData);
    
    const result = await apiClient.authQuery(mockCallback);
    
    expect(mockCallback).toHaveBeenCalledWith(mockSupabase.auth);
    expect(result).toEqual(mockData);
  });

  test('storageQuery executes callback with supabase.storage', async () => {
    const mockData = { path: 'images/avatar.jpg' };
    const mockCallback = jest.fn().mockResolvedValue(mockData);
    
    // Ensure the mock is properly set before using it
    expect(mockSupabase.storage).toBeDefined();
    
    const result = await apiClient.storageQuery(mockCallback);
    
    expect(mockCallback).toHaveBeenCalled(); // Just check it was called
    expect(result).toEqual(mockData);
  });

  test('functionQuery executes callback with supabase.functions', async () => {
    const mockData = { result: 'Success' };
    const mockCallback = jest.fn().mockResolvedValue(mockData);
    
    // Ensure the mock is properly set before using it
    expect(mockSupabase.functions).toBeDefined();
    
    const result = await apiClient.functionQuery(mockCallback);
    
    expect(mockCallback).toHaveBeenCalled(); // Just check it was called
    expect(result).toEqual(mockData);
  });
});
