
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Check if Jest is installed
try {
  // Using dynamic import to check if Jest is available
  await import('jest');
  console.log('Jest is installed, running tests...');
} catch (e) {
  console.log('Jest is not installed. Installing required packages...');
  
  // Install necessary testing packages
  const packages = [
    'jest',
    'ts-jest',
    '@types/jest',
    'jest-environment-jsdom',  // Added this package
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event'
  ];
  
  try {
    execSync(`npm install --no-save ${packages.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install packages:', error);
    process.exit(1);
  }
}

// Ensure test setup directory exists
if (!existsSync('./tests/setup')) {
  try {
    await mkdir('./tests/setup', { recursive: true });
  } catch (error) {
    console.error('Failed to create setup directory:', error);
  }
}

// Run tests
const testPathPattern = process.argv[2] || '';
try {
  console.log(`Running tests${testPathPattern ? ` matching pattern: ${testPathPattern}` : ''}...`);
  execSync(`npx jest ${testPathPattern}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Tests failed with error:', error);
  process.exit(1);
}
