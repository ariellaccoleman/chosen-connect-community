
import { 
  createTestContext
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
  // This will automatically generate a randomized schema name
  const profileContext = createTestContext<Profile>('profiles', {
    initialData: mockProfiles,
    mockDataInTestEnv: false, // Always use real database
    validateSchema: true // Ensure schema is properly validated
  });

  // Set up and clean up for each test
  beforeEach(async () => {
    console.log('Setting up test context with profiles:', mockProfiles.length);
    console.log('First profile:', JSON.stringify(mockProfiles[0], null, 2));
    
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
    console.log('Current schema:', profileContext.getCurrentSchema());
    
    const result = await repository.select().execute();
    console.log('Query result:', { 
      error: result.error, 
      dataLength: result.data?.length,
      hasData: !!result.data,
      isError: result.isError?.()
    });
    
    if (result.error) {
      console.error('Query error details:', result.error);
    }
    
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
    console.log('Current schema:', profileContext.getCurrentSchema());
    
    // Insert the profile
    const insertResult = await repository.insert(newProfile).execute();
    console.log('Insert result:', { 
      error: insertResult.error, 
      hasData: !!insertResult.data,
      isError: insertResult.isError?.()
    });
    
    if (insertResult.error) {
      console.error('Insert error details:', insertResult.error);
    }
    
    expect(insertResult.error).toBeNull();
    
    // Retrieve all profiles
    const result = await repository.select().execute();
    console.log('Select all result:', { 
      error: result.error, 
      dataLength: result.data?.length,
      hasData: !!result.data
    });
    
    if (result.error) {
      console.error('Select error details:', result.error);
    }
    
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

  test('should validate schema structure', async () => {
    console.log('Starting test: should validate schema structure');
    
    // Validate the schema structure
    const validationResult = await profileContext.validateSchema();
    console.log('Schema validation result:', {
      exists: !!validationResult,
      status: validationResult?.status,
      isValid: validationResult?.validationResult?.isValid,
      summary: validationResult?.validationResult?.summary?.substring(0, 100) + '...'
    });
    
    expect(validationResult).toBeTruthy();
    expect(validationResult?.status).toBe('validated');
    expect(validationResult?.validationResult?.isValid).toBe(true);
  });

  // Release the test schema after all tests
  afterAll(async () => {
    console.log('Releasing test context schema');
    await profileContext.release();
  });
});
