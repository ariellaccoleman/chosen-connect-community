
import { 
  createTestContext, 
  setupTestingEnvironment, 
  teardownTestingEnvironment,
  setupTestSchema
} from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';

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
  // Skip these tests in CI environment since they require real database
  const shouldSkip = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
  
  if (shouldSkip) {
    test.skip('Skipping database tests in CI environment', () => {
      console.log('Database tests skipped - CI environment detected');
    });
    return;
  }

  // Create test data
  const mockProfiles = Array(3).fill(null).map(() => createMockProfile());
  
  // Create a test context for profiles with a unique schema
  const profileContext = createTestContext<Profile>('profiles', {
    initialData: mockProfiles,
    mockDataInTestEnv: false, // Always use real database
    validateSchema: true // Ensure schema is properly validated
  });

  // Set up and clean up for each test
  beforeEach(async () => {
    await profileContext.setup({ 
      initialData: mockProfiles,
      validateSchema: true
    });
  });
  
  afterEach(async () => {
    await profileContext.cleanup();
  });

  test('should retrieve seeded profiles', async () => {
    // Use the repository from the test context
    const repository = profileContext.getRepository();
    const result = await repository.select().execute();
    
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
    const repository = profileContext.getRepository();
    
    // Insert the profile
    const insertResult = await repository.insert(newProfile).execute();
    expect(insertResult.error).toBeNull();
    
    // Retrieve all profiles
    const result = await repository.select().execute();
    
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

  // Release the test schema after all tests
  afterAll(async () => {
    await profileContext.release();
  });
});
