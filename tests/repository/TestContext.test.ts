
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
    console.log('Setting up test context with profiles:', mockProfiles.length);
    await profileContext.setup({ 
      initialData: mockProfiles,
      validateSchema: true
    });
    console.log('Test context setup complete. Current schema:', profileContext.getCurrentSchema());
  });
  
  afterEach(async () => {
    console.log('Cleaning up test context');
    await profileContext.cleanup();
  });

  test('should retrieve seeded profiles', async () => {
    console.log('Starting test: should retrieve seeded profiles');
    
    // Use the repository from the test context
    const repository = profileContext.getRepository();
    console.log('Got repository, executing select query');
    
    const result = await repository.select().execute();
    console.log('Query result:', { error: result.error, dataLength: result.data?.length });
    
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
    console.log('Starting test: should create isolated test data');
    
    // Create a new profile
    const newProfile = createMockProfile();
    const repository = profileContext.getRepository();
    
    console.log('Inserting new profile:', newProfile.id);
    
    // Insert the profile
    const insertResult = await repository.insert(newProfile).execute();
    console.log('Insert result:', { error: insertResult.error, data: !!insertResult.data });
    expect(insertResult.error).toBeNull();
    
    // Retrieve all profiles
    const result = await repository.select().execute();
    console.log('Select all result:', { error: result.error, dataLength: result.data?.length });
    
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
    console.log('Releasing test context schema');
    await profileContext.release();
  });
});
