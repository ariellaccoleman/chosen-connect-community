
// Simplified mock Supabase client for testing

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
  
  // Database methods - simplified for basic testing
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
};

// Mock the actual Supabase client import
jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

export const resetSupabaseMocks = () => {
  // Reset all mock functions
  Object.keys(mockSupabase.auth).forEach(key => {
    if (typeof mockSupabase.auth[key] === 'function' && mockSupabase.auth[key].mockClear) {
      mockSupabase.auth[key].mockClear();
    }
  });
  
  // Reset database method mocks
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'single', 'maybeSingle'].forEach(method => {
    if (mockSupabase[method] && mockSupabase[method].mockClear) {
      mockSupabase[method].mockClear();
    }
  });
};
