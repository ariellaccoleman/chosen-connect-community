
//Confirm it's node
#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');

// Check if Jest is installed
try {
  require.resolve('jest');
  console.log('Jest is installed, running tests...');
} catch (e) {
  console.log('Jest is not installed. Installing required packages...');
  
  // Install necessary testing packages
  const packages = [
    'jest',
    'ts-jest',
    '@types/jest',
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
  execSync('mkdir -p ./tests/setup', { stdio: 'inherit' });
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
