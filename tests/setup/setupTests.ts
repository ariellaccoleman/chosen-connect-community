
// Add global test setup here
import '@testing-library/jest-dom';

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

// Mock resize observer which isn't available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
