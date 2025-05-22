
import { renderHook, act, waitFor } from '@testing-library/react';
import { createQueryHooks } from '@/hooks/core/factory/queryHookFactory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ApiResponse } from '@/api/core/errorHandler';

// Mock toast
jest.mock('@/components/ui/sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock api operations
const mockApiOperations = {
  getAll: jest.fn(),
  getById: jest.fn(),
  getByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  batchCreate: jest.fn(),
  batchUpdate: jest.fn(),
  batchDelete: jest.fn()
};

// Define test entity type
interface TestEntity {
  id: string;
  name: string;
}

// Setup test wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  
  // Fix the JSX syntax issue by properly typing the children prop
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Query Hook Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('useList calls getAll with correct params', async () => {
    // Setup
    const mockResult: ApiResponse<TestEntity[]> = {
      data: [{ id: '1', name: 'Test' }],
      error: null,
      status: 'success'
    };
    mockApiOperations.getAll.mockResolvedValue(mockResult);
    
    const hooks = createQueryHooks(
      { name: 'testEntity' }, 
      mockApiOperations as any
    );
    
    // Execute
    const { result } = renderHook(
      () => hooks.useList({ search: 'test' }),
      { wrapper: createWrapper() }
    );
    
    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify
    expect(mockApiOperations.getAll).toHaveBeenCalledWith({ search: 'test' });
    expect(result.current.data).toEqual(mockResult);
  });
  
  test('useById calls getById with correct id', async () => {
    // Setup
    const mockResult: ApiResponse<TestEntity> = {
      data: { id: '123', name: 'Test Item' },
      error: null,
      status: 'success'
    };
    mockApiOperations.getById.mockResolvedValue(mockResult);
    
    const hooks = createQueryHooks(
      { name: 'testEntity' }, 
      mockApiOperations as any
    );
    
    // Execute
    const { result } = renderHook(
      () => hooks.useById('123'),
      { wrapper: createWrapper() }
    );
    
    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify
    expect(mockApiOperations.getById).toHaveBeenCalledWith('123');
    expect(result.current.data).toEqual(mockResult);
  });
  
  test('useCreate calls create with correct data', async () => {
    // Setup
    const newEntity = { name: 'New Item' };
    const mockResult: ApiResponse<TestEntity> = {
      data: { id: '999', ...newEntity },
      error: null,
      status: 'success'
    };
    mockApiOperations.create.mockResolvedValue(mockResult);
    
    const hooks = createQueryHooks(
      { name: 'testEntity' }, 
      mockApiOperations as any
    );
    
    // Execute
    const { result } = renderHook(
      () => hooks.useCreate(),
      { wrapper: createWrapper() }
    );
    
    // Use the mutation
    act(() => {
      result.current.mutate(newEntity);
    });
    
    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify
    expect(mockApiOperations.create).toHaveBeenCalledWith(newEntity);
    expect(result.current.data).toEqual(mockResult);
  });
  
  test('useUpdate calls update with correct id and data', async () => {
    // Setup
    const updateData = { name: 'Updated Item' };
    const mockResult: ApiResponse<TestEntity> = {
      data: { id: '123', ...updateData },
      error: null,
      status: 'success'
    };
    mockApiOperations.update.mockResolvedValue(mockResult);
    
    const hooks = createQueryHooks(
      { name: 'testEntity' }, 
      mockApiOperations as any
    );
    
    // Execute
    const { result } = renderHook(
      () => hooks.useUpdate(),
      { wrapper: createWrapper() }
    );
    
    // Use the mutation
    act(() => {
      result.current.mutate({ id: '123', data: updateData });
    });
    
    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify
    expect(mockApiOperations.update).toHaveBeenCalledWith('123', updateData);
    expect(result.current.data).toEqual(mockResult);
  });
  
  test('useDelete calls delete with correct id', async () => {
    // Setup
    const mockResult: ApiResponse<boolean> = {
      data: true,
      error: null,
      status: 'success'
    };
    mockApiOperations.delete.mockResolvedValue(mockResult);
    
    const hooks = createQueryHooks(
      { name: 'testEntity' }, 
      mockApiOperations as any
    );
    
    // Execute
    const { result } = renderHook(
      () => hooks.useDelete(),
      { wrapper: createWrapper() }
    );
    
    // Use the mutation
    act(() => {
      result.current.mutate('123');
    });
    
    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify
    expect(mockApiOperations.delete).toHaveBeenCalledWith('123');
    expect(result.current.data).toEqual(mockResult);
  });
});
