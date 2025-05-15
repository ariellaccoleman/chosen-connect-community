
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
    return this;
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
    return this;
  }),
  maybeSingle: jest.fn(function() {
    return this;
  }),
  
  // Add proper promise resolution
  then: jest.fn(function(callback) {
    // Handle the standard error case for 'invalid-id'
    if (this.currentTable && this.currentTable === 'tags' && 
        mockSupabase.eq.mock.calls.length > 0 && 
        mockSupabase.eq.mock.calls[0][1] === 'invalid-id') {
      return Promise.resolve({ 
        data: null, 
        error: mockErrorResponse.error 
      }).then(callback);
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
  
  // Reset currentTable
  mockSupabase.currentTable = null;
};
