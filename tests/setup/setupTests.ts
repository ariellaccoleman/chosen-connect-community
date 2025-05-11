
// Add global test setup here
beforeAll(() => {
  // Setup global test environment
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Cleanup after all tests
  jest.restoreAllMocks();
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
