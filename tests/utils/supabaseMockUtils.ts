
/**
 * Utility to create a chainable Supabase mock
 * This solves the issue with method chaining in tests
 */
export function createChainableMock() {
  // Track the current table being used in the query
  let currentTable = '';
  
  // Create the basic mock structure
  const mock = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    lt: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    rangeLt: jest.fn(),
    rangeGt: jest.fn(),
    rangeGte: jest.fn(),
    rangeLte: jest.fn(),
    rangeAdjacent: jest.fn(),
    overlaps: jest.fn(),
    textSearch: jest.fn(),
    match: jest.fn(),
    not: jest.fn(),
    or: jest.fn(),
    and: jest.fn(),
    filter: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    csv: jest.fn(),
    rpc: jest.fn(),
    // Add any other methods you need to chain
    
    // Store the mock responses for each table or operation
    _responses: {} as Record<string, any>,
    
    // Set up mock responses
    mockResponseFor: function(table: string, response: any) {
      this._responses[table] = response;
      return this;
    },
    
    // Reset all mocks
    reset: function() {
      Object.keys(this).forEach(key => {
        if (typeof this[key] === 'function' && this[key].mockClear) {
          this[key].mockClear();
        }
      });
      this._responses = {};
      currentTable = '';
      return this;
    }
  };
  
  // Make each method return the mock itself for chaining
  Object.keys(mock).forEach(key => {
    if (key !== '_responses' && key !== 'mockResponseFor' && key !== 'reset') {
      mock[key].mockImplementation((...args) => {
        if (key === 'from') {
          currentTable = args[0];
        }
        
        // Special case for methods that should return data
        if (['single', 'maybeSingle'].includes(key)) {
          const mockResponse = mock._responses[currentTable] || { data: null, error: null };
          return Promise.resolve(mockResponse);
        }
        
        return mock;
      });
    }
  });
  
  return mock;
}

/**
 * Utility to create common Supabase responses
 */
export function createSuccessResponse(data: any) {
  return { data, error: null };
}

export function createErrorResponse(message: string) {
  return { data: null, error: { message } };
}
