
// Import needed polyfills or setup test environment
import '@testing-library/jest-dom';

// Reset all mocks after each test automatically
afterEach(() => {
  jest.clearAllMocks();
});

// Add global console overrides to reduce test noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Silence specific expected console messages during tests
console.error = (...args) => {
  // Allow errors from Jest's expect statements to show
  if (args[0]?.includes?.('Error: expect(') || 
      args[0]?.message?.includes?.('expect(')) {
    originalConsoleError(...args);
    return;
  }
  
  // Filter out React warnings about act() for testing purposes
  if (typeof args[0] === 'string' && 
      (args[0].includes('Warning: The current testing environment is not configured to support act') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('was not wrapped in act'))) {
    return;
  }
  
  // Prevent test failures from duplicate console errors
  try {
    originalConsoleError(...args);
  } catch (e) {
    // Prevent circular reference errors in console output
    console.log('Console error suppressed to prevent test failures:', 
      typeof args[0] === 'object' ? 'Error object' : args[0]);
  }
};

console.warn = (...args) => {
  // Filter out specific expected warnings
  if (typeof args[0] === 'string' && 
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: findDOMNode is deprecated'))) {
    return;
  }
  
  originalConsoleWarn(...args);
};

// Restore console methods after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  })
) as jest.Mock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {}
  disconnect() {}
  observe() {}
  takeRecords() { return [] }
  unobserve() {}
};

// Set timezone to UTC for consistent date/time testing
process.env.TZ = 'UTC';

// Suppress act() warnings
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};
