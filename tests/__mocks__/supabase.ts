
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
  error: { message: 'Invalid credentials', status: 400 }
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
  
  // Database methods
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
  in: jest.fn().mockReturnThis(),
  
  // Storage methods
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockReturnThis(),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } })
  },
  
  // Edge functions
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: {}, error: null })
  }
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
