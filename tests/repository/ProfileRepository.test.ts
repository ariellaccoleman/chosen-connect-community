
import { 
  setupTestSchema, 
  cleanupOldTestSchemas,
  clearTestTable, 
  seedTestData,
  createTestContext
} from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';

describe('ProfileRepository with Schema-Based Testing', () => {
  // Set up test context for managing database schema and lifecycle
  const testContext = createTestContext<Profile>('profiles', {
    requiredTables: ['profiles'],
    // Never use mock data, always use a real database
    mockDataInTestEnv: false
  });
  
  // Generate test profiles before each test
  let mockProfiles: Profile[];
  
  beforeEach(async () => {
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
    
    // Set up test schema and seed data
    await testContext.setup({ initialData: mockProfiles });
  });
  
  afterEach(async () => {
    // Clean up test data after each test
    await testContext.cleanup();
  });
  
  test('should create and retrieve a profile', async () => {
    // Get repository from test context
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
    const updatedName = 'Updated Name';
    
    // Update the profile
    const updateResult = await repository
      .update({ first_name: updatedName })
      .eq('id', mockProfile.id)
      .execute();
    
    // Verify update was successful
    expect(updateResult.error).toBeNull();
    
    // Retrieve the updated profile to verify changes
    const retrieveResult = await repository
      .select()
      .eq('id', mockProfile.id)
      .single();
    
    // Verify the update was applied correctly
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
  
  // Clean up test schema after all tests
  afterAll(async () => {
    await testContext.release();
    
    // Also clean up any old test schemas that might be lingering
    await cleanupOldTestSchemas();
  });
});
