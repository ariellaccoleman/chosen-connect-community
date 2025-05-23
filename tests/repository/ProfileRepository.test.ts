
import { createTestingProfileRepository } from '@/api/core/repository/entities/factories/profileRepositoryFactory';
import { 
  setupTestSchema, 
  clearTestTable, 
  seedTestData,
  setupTestingEnvironment, 
  teardownTestingEnvironment,
  createTestContext
} from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';
import { jest } from '@jest/globals';

// Generate a unique test ID for this test run
const TEST_RUN_ID = uuidv4().substring(0, 8);

// Mock the supabase client to avoid actual API calls during tests
jest.mock('@/integrations/supabase/client', () => {
  // Create a shared mock data store across mocked methods
  const mockData = {
    profiles: []
  };
  
  const mockSupabase = {
    from: (table) => {
      // Initialize table if it doesn't exist
      if (!mockData[table]) {
        mockData[table] = [];
      }
      
      return {
        select: jest.fn().mockReturnValue({
          execute: jest.fn().mockImplementation(() => {
            return Promise.resolve({ 
              data: mockData[table], 
              error: null 
            });
          }),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              if (table === 'profiles' && mockData[table]?.length > 0) {
                return Promise.resolve({ 
                  data: mockData[table][0], 
                  error: null 
                });
              }
              return Promise.resolve({ data: null, error: null });
            }),
            maybeSingle: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                data: mockData[table]?.length > 0 ? mockData[table][0] : null, 
                error: null 
              });
            }),
            execute: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                data: mockData[table], 
                error: null 
              });
            }),
          }),
        }),
        insert: jest.fn().mockImplementation((data) => {
          // Handle array or single item
          const newItems = Array.isArray(data) ? data : [data];
          
          // Add items to mock data with defaults
          newItems.forEach(item => {
            const newItem = {
              ...item,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            mockData[table].push(newItem);
          });
          
          return {
            execute: jest.fn().mockReturnValue({ 
              data: newItems.length === 1 ? newItems[0] : newItems, 
              error: null 
            }),
            single: jest.fn().mockReturnValue({ 
              data: newItems.length === 1 ? newItems[0] : newItems[0], 
              error: null 
            }),
          };
        }),
        update: jest.fn().mockImplementation((updates) => {
          return {
            eq: jest.fn().mockImplementation((field, value) => {
              if (mockData[table]) {
                const index = mockData[table].findIndex(item => item[field] === value);
                if (index !== -1) {
                  mockData[table][index] = {
                    ...mockData[table][index],
                    ...updates,
                    updated_at: new Date().toISOString()
                  };
                  
                  return {
                    execute: jest.fn().mockReturnValue({ 
                      data: mockData[table][index], 
                      error: null 
                    }),
                    single: jest.fn().mockReturnValue({ 
                      data: mockData[table][index], 
                      error: null 
                    }),
                  };
                }
              }
              return {
                execute: jest.fn().mockReturnValue({ data: null, error: null }),
                single: jest.fn().mockReturnValue({ data: null, error: null }),
              };
            }),
          };
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((field, value) => {
            if (mockData[table]) {
              const index = mockData[table].findIndex(item => item[field] === value);
              if (index !== -1) {
                mockData[table].splice(index, 1);
              }
              return {
                execute: jest.fn().mockReturnValue({ data: null, error: null }),
              };
            }
            return {
              execute: jest.fn().mockReturnValue({ data: null, error: null }),
            };
          }),
        }),
      };
    },
    rpc: jest.fn().mockReturnValue({ data: null, error: null }),
  };
  
  return { supabase: mockSupabase };
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
    mockProfiles = Array(3).fill(null).map(() => createMockProfile());
    return testContext.setup({ initialData: mockProfiles });
  });
  
  afterEach(() => testContext.cleanup());
  
  test('should create and retrieve a profile', async () => {
    // Create a repository using the test context
    const repository = testContext.getRepository();
    
    // Create a mock profile
    const mockProfile = createMockProfile();
    
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
