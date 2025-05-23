
import { createTestContext, setupTestingEnvironment, teardownTestingEnvironment } from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';
import { jest } from '@jest/globals';

// Mock the supabase client to avoid actual API calls during tests
jest.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          execute: jest.fn().mockReturnValue({ data: [], error: null }),
          eq: () => ({
            single: jest.fn().mockReturnValue({ data: {}, error: null }),
            maybeSingle: jest.fn().mockReturnValue({ data: null, error: null }),
          }),
        }),
        insert: () => ({
          execute: jest.fn().mockReturnValue({ data: [], error: null }),
        }),
        delete: () => ({
          eq: () => ({
            execute: jest.fn().mockReturnValue({ data: null, error: null }),
          }),
        }),
      }),
      rpc: jest.fn().mockReturnValue({ data: null, error: null }),
    },
  };
});

// Example mock data generator for profiles
const createMockProfile = (): Profile => ({
  id: uuidv4(),
  first_name: `Test ${Math.floor(Math.random() * 1000)}`,
  last_name: `User ${Math.floor(Math.random() * 1000)}`,
  email: `test${Math.floor(Math.random() * 10000)}@example.com`,
  is_approved: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

describe('Test Context Helper', () => {
  // Set up the testing schema once before all tests
  const setupFn = setupTestingEnvironment();
  beforeAll(setupFn);
  
  // Create test data
  const mockProfiles = Array(3).fill(null).map(() => createMockProfile());
  
  // Create a test context for profiles
  const profileContext = createTestContext<Profile>('profiles');

  // Set up and clean up for each test
  beforeEach(async () => await profileContext.setup(mockProfiles));
  afterEach(async () => await profileContext.cleanup());

  test('should retrieve seeded profiles', async () => {
    // Use the repository from the test context
    const result = await profileContext.repository.select().execute();
    
    // Verify profiles were retrieved
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(mockProfiles.length);
    
    // Verify the profile data matches
    mockProfiles.forEach(mockProfile => {
      const found = result.data?.find(p => p.id === mockProfile.id);
      expect(found).toBeTruthy();
      expect(found).toMatchObject({
        id: mockProfile.id,
        first_name: mockProfile.first_name,
        last_name: mockProfile.last_name
      });
    });
  });

  test('should create isolated test data', async () => {
    // Create a new profile
    const newProfile = createMockProfile();
    
    // Insert the profile
    await profileContext.repository.insert(newProfile).execute();
    
    // Retrieve all profiles
    const result = await profileContext.repository.select().execute();
    
    // Verify the new profile was added
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(mockProfiles.length + 1);
    
    // Verify the new profile data
    const found = result.data?.find(p => p.id === newProfile.id);
    expect(found).toBeTruthy();
    expect(found).toMatchObject({
      id: newProfile.id,
      first_name: newProfile.first_name,
      last_name: newProfile.last_name
    });
  });

  // Clean up after all tests
  const teardownFn = teardownTestingEnvironment(['profiles']);
  afterAll(teardownFn);
});
