
#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');

// Check if Jest is installed
try {
  require.resolve('jest');
  console.log('Jest is installed, checking for jest-environment-jsdom...');
} catch (e) {
  console.log('Jest is not installed. Installing required packages...');
  
  // Install necessary testing packages
  const packages = [
    'jest',
    'ts-jest',
    '@types/jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jest-environment-jsdom' // Add jsdom environment explicitly
  ];
  
  try {
    execSync(`npm install --no-save ${packages.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install packages:', error);
    process.exit(1);
  }
}

// Check specifically for jest-environment-jsdom
try {
  require.resolve('jest-environment-jsdom');
  console.log('jest-environment-jsdom is installed.');
} catch (e) {
  console.log('jest-environment-jsdom is not installed. Installing...');
  try {
    execSync('npm install --no-save jest-environment-jsdom', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install jest-environment-jsdom:', error);
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
