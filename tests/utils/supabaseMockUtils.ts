
/**
 * Utility to create a chainable Supabase mock
 * This solves the issue with method chaining in tests
 */
export function createChainableMock() {
  // Track the current table being used in the query
  let currentTable = '';
  
  // Create the basic mock structure
  const mock = {
    currentTable: '',
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
    then: jest.fn(),
    catch: jest.fn(),
    
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
      this.currentTable = '';
      return this;
    }
  };
  
  // Make each method return the mock itself for chaining
  Object.keys(mock).forEach(key => {
    if (key !== '_responses' && key !== 'mockResponseFor' && key !== 'reset' && key !== 'currentTable' && 
        key !== 'then' && key !== 'catch') {
      mock[key].mockImplementation((...args) => {
        if (key === 'from') {
          mock.currentTable = args[0];
        }
        return mock;
      });
    }
  });

  // Override implementation for the terminal methods that return promises
  mock.then = jest.fn().mockImplementation(function(onFulfilled) {
    const mockResponse = this._responses[this.currentTable];
    
    // If this is an error response, we should reject the promise
    if (mockResponse && mockResponse.error) {
      return Promise.reject(mockResponse.error);
    }
    
    return Promise.resolve(mockResponse || { data: null, error: null }).then(onFulfilled);
  });

  // Add proper catch method to handle rejections
  mock.catch = jest.fn().mockImplementation(function(onRejected) {
    const mockResponse = this._responses[this.currentTable];
    
    if (mockResponse && mockResponse.error) {
      return Promise.reject(mockResponse.error).catch(onRejected);
    }
    
    return Promise.resolve(mockResponse || { data: null, error: null }).catch(onRejected);
  });
  
  // Special implementation for single and maybeSingle
  mock.single.mockImplementation(function() {
    return {
      then: (onFulfilled) => {
        const mockResponse = this._responses[this.currentTable];
        if (mockResponse && mockResponse.error) {
          return Promise.reject(mockResponse.error);
        }
        return Promise.resolve(mockResponse || { data: null, error: null }).then(onFulfilled);
      },
      catch: (onRejected) => {
        return Promise.resolve({ data: null, error: null }).catch(onRejected);
      }
    };
  });
  
  mock.maybeSingle.mockImplementation(function() {
    return {
      then: (onFulfilled) => {
        const mockResponse = this._responses[this.currentTable];
        if (mockResponse && mockResponse.error) {
          return Promise.reject(mockResponse.error);
        }
        return Promise.resolve(mockResponse || { data: null, error: null }).then(onFulfilled);
      },
      catch: (onRejected) => {
        return Promise.resolve({ data: null, error: null }).catch(onRejected);
      }
    };
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
