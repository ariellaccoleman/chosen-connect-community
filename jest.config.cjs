
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx' // Explicitly set JSX handling
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  testMatch: ['**/tests/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/api/**/*.ts',
    'src/utils/**/*.ts',
    'src/hooks/**/*.ts',
    'src/components/**/*.tsx',
    'src/pages/**/*.tsx',
    '!src/**/*.d.ts'
  ],
  clearMocks: true,
  resetMocks: false, // We want to control mocks explicitly
  restoreMocks: false // We'll restore mocks in afterEach/afterAll hooks
};

module.exports = config;
