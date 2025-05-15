
// Mock Supabase client for testing

export const mockAuthResponse = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: { role: 'user' }
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600
    }
  },
  error: null
};

export const mockErrorResponse = {
  data: { user: null, session: null },
  error: { message: 'Database error', code: 'DB_ERROR' }
};

export const mockSupabase = {
  // For tracking the current table being queried
  currentTable: null,
  
  // Auth methods
  auth: {
    signUp: jest.fn().mockResolvedValue(mockAuthResponse),
    signInWithPassword: jest.fn().mockResolvedValue(mockAuthResponse),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: mockAuthResponse.data.session } }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue(mockAuthResponse),
    onAuthStateChange: jest.fn().mockReturnValue({ 
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  },
  
  // Storage methods - ensure these match what's expected in the tests
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      remove: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null })
    }),
    createBucket: jest.fn().mockResolvedValue({ data: { name: 'test-bucket' }, error: null }),
    getBucket: jest.fn().mockResolvedValue({ data: { name: 'test-bucket' }, error: null }),
    listBuckets: jest.fn().mockResolvedValue({ data: [], error: null })
  },
  
  // Functions methods - ensure these match what's expected in the tests
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: { result: 'success' }, error: null }),
    createClient: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({ data: { result: 'success' }, error: null })
    })
  },
  
  // Database methods - properly chaining
  from: jest.fn(function(table) {
    this.currentTable = table;
    return this;
  }),
  select: jest.fn(function() {
    return this;
  }),
  insert: jest.fn(function() {
    return this;
  }),
  update: jest.fn(function() {
    return this;
  }),
  delete: jest.fn(function() {
    return {
      eq: (field, value) => {
        mockSupabase.eq(field, value);
        return Promise.resolve({ data: true, error: null });
      }
    };
  }),
  eq: jest.fn(function() {
    return this;
  }),
  in: jest.fn(function() {
    return this;
  }),
  order: jest.fn(function() {
    return this;
  }),
  range: jest.fn(function() {
    return this;
  }),
  limit: jest.fn(function() {
    return this;
  }),
  ilike: jest.fn(function() {
    return this;
  }),
  single: jest.fn(function() {
    // For create operation
    if (mockSupabase.insert.mock.calls.length > 0) {
      const newEntityData = mockSupabase.insert.mock.calls[0][0];
      return Promise.resolve({
        data: { id: '999', ...newEntityData, created_at: new Date().toISOString() },
        error: null
      });
    }
    
    // For update operation
    if (mockSupabase.update.mock.calls.length > 0) {
      const updateData = mockSupabase.update.mock.calls[0][0];
      return Promise.resolve({
        data: { 
          id: '123', 
          name: 'Test Entity', 
          ...updateData,
          created_at: new Date().toISOString()
        },
        error: null
      });
    }
    
    return this;
  }),
  maybeSingle: jest.fn(function() {
    // Handle the standard error case for 'invalid-id'
    if (this.currentTable === 'tags' && 
        mockSupabase.eq.mock.calls.length > 0 && 
        mockSupabase.eq.mock.calls[0][1] === 'invalid-id') {
      return Promise.resolve({ 
        data: null, 
        error: mockErrorResponse.error 
      });
    }
    
    return Promise.resolve({ 
      data: { id: '123', name: 'Test Entity' },
      error: null 
    });
  }),
  
  // Add proper promise resolution
  then: jest.fn(function(callback) {
    // Handle the standard error case for 'invalid-id'
    if (this.currentTable === 'tags' && 
        mockSupabase.eq.mock.calls.length > 0 && 
        mockSupabase.eq.mock.calls[0][1] === 'invalid-id') {
      return Promise.resolve({ 
        data: null, 
        error: mockErrorResponse.error 
      }).then(callback);
    }
    
    // For regular queries, return sample data
    if (mockSupabase.select.mock.calls.length > 0) {
      // If we're doing a filtered query
      if (mockSupabase.eq.mock.calls.length > 0) {
        return Promise.resolve({ 
          data: [{ id: '1', name: 'Test' }],
          error: null 
        }).then(callback);
      }
    }
    
    return Promise.resolve({ data: {}, error: null }).then(callback);
  }),
  
  catch: jest.fn(function(callback) {
    return Promise.resolve({ data: {}, error: null }).catch(callback);
  })
};

// Mock the actual Supabase client import
jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

export const resetSupabaseMocks = () => {
  // Reset all mock functions
  Object.keys(mockSupabase).forEach(key => {
    if (typeof mockSupabase[key] === 'function' && mockSupabase[key].mockClear) {
      mockSupabase[key].mockClear();
    }
  });
  
  // Reset auth mocks
  Object.keys(mockSupabase.auth).forEach(key => {
    if (typeof mockSupabase.auth[key] === 'function' && mockSupabase.auth[key].mockClear) {
      mockSupabase.auth[key].mockClear();
    }
  });
  
  // Reset storage mocks
  Object.keys(mockSupabase.storage).forEach(key => {
    if (typeof mockSupabase.storage[key] === 'function' && mockSupabase.storage[key].mockClear) {
      mockSupabase.storage[key].mockClear();
    }
  });
  
  // Reset functions mocks
  Object.keys(mockSupabase.functions).forEach(key => {
    if (typeof mockSupabase.functions[key] === 'function' && mockSupabase.functions[key].mockClear) {
      mockSupabase.functions[key].mockClear();
    }
  });
  
  // Reset currentTable
  mockSupabase.currentTable = null;
};
