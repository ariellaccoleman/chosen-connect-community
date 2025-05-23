
/**
 * Simple script to identify test files that need to be migrated from mock repositories
 * to schema-based testing.
 * 
 * Usage: node scripts/identify-tests-to-migrate.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to look for
const MOCK_PATTERNS = [
  'createMockRepository',
  'MockRepository',
  'mockRepositoryFactory'
];

// Find all test files
const testFiles = execSync('find tests -name "*.test.ts" -o -name "*.test.tsx"')
  .toString()
  .split('\n')
  .filter(Boolean);

// Check each file for mock patterns
const filesToMigrate = testFiles.filter(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return MOCK_PATTERNS.some(pattern => content.includes(pattern));
  } catch (err) {
    console.error(`Error reading file ${file}:`, err);
    return false;
  }
});

// Output results
console.log('\nFiles that need migration:');
console.log('=========================');
filesToMigrate.forEach(file => {
  console.log(file);
});

console.log(`\nFound ${filesToMigrate.length} files out of ${testFiles.length} that need migration.`);
console.log('\nPriority order for migration:');
console.log('1. Core repository tests');
console.log('2. Entity repository tests');
console.log('3. API layer tests that use repositories');
console.log('4. Integration tests\n');
