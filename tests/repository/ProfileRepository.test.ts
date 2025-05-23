
import { createTestingProfileRepository } from '@/api/core/repository/entities/factories/profileRepositoryFactory';
import { 
  setupTestSchema, 
  clearTestTable, 
  seedTestData,
  teardownTestingEnvironment,
  createTestContext
} from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique test ID for this test run
const TEST_RUN_ID = uuidv4().substring(0, 8);

describe('ProfileRepository with Schema-Based Testing', () => {
  // Use testContext to manage repository lifecycle, schema, and cleanup
  const testContext = createTestContext<Profile>('profiles', {
    requiredTables: ['profiles'],
    mockDataInTestEnv: true
  });
  
  // Generate test profiles before each test
  let mockProfiles: Profile[];
  
  beforeEach(() => {
    // Create fresh profiles for each test
    mockProfiles = Array(3).fill(null).map(() => ({
      id: uuidv4(),
      first_name: `Test ${Math.floor(Math.random() * 1000)}`,
      last_name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 10000)}@example.com`,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    return testContext.setup({ initialData: mockProfiles });
  });
  
  afterEach(() => testContext.cleanup());
  
  test('should create and retrieve a profile', async () => {
    // Create a repository using the test context
    const repository = testContext.getRepository();
    
    // Create a mock profile
    const mockProfile = {
      id: uuidv4(),
      first_name: `Test ${Math.floor(Math.random() * 1000)}`,
      last_name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 10000)}@example.com`,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the profile
    const insertResult = await repository.insert(mockProfile).execute();
    
    // Verify insertion was successful
    expect(insertResult.error).toBeNull();
    expect(insertResult.data).toBeTruthy();
    
    // Retrieve the profile
    const retrieveResult = await repository
      .select()
      .eq('id', mockProfile.id)
      .single();
    
    // Verify retrieval was successful
    expect(retrieveResult.error).toBeNull();
    expect(retrieveResult.data).toMatchObject({
      id: mockProfile.id,
      first_name: mockProfile.first_name,
      last_name: mockProfile.last_name,
      email: mockProfile.email
    });
  });
  
  test('should update a profile', async () => {
    // Get repository from test context
    const repository = testContext.getRepository();
    
    // Use an existing profile from mockProfiles
    const mockProfile = mockProfiles[0];
    
    // Update the profile
    const updatedName = 'Updated Name';
    const updateResult = await repository
      .update({ first_name: updatedName })
      .eq('id', mockProfile.id)
      .execute();
    
    // Verify update was successful
    expect(updateResult.error).toBeNull();
    
    // Retrieve the updated profile
    const retrieveResult = await repository
      .select()
      .eq('id', mockProfile.id)
      .single();
    
    // Verify the update was applied
    expect(retrieveResult.error).toBeNull();
    expect(retrieveResult.data).toMatchObject({
      id: mockProfile.id,
      first_name: updatedName,
      last_name: mockProfile.last_name
    });
  });
  
  test('should delete a profile', async () => {
    // Get repository from test context
    const repository = testContext.getRepository();
    
    // Use an existing profile from mockProfiles
    const mockProfile = mockProfiles[0];
    
    // Delete the profile
    const deleteResult = await repository
      .delete()
      .eq('id', mockProfile.id)
      .execute();
    
    // Verify deletion was successful
    expect(deleteResult.error).toBeNull();
    
    // Try to retrieve the deleted profile
    const retrieveResult = await repository
      .select()
      .eq('id', mockProfile.id)
      .maybeSingle();
    
    // Verify the profile no longer exists
    expect(retrieveResult.data).toBeNull();
  });
  
  // Release the test schema after all tests
  afterAll(() => testContext.release());
});
