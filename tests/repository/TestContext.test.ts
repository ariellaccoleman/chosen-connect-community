
import { 
  createTestContext, 
  setupTestingEnvironment, 
  teardownTestingEnvironment 
} from '@/api/core/testing/schemaBasedTesting';
import { Profile } from '@/types/profile';
import { v4 as uuidv4 } from 'uuid';
import { jest } from '@jest/globals';

// Mock the supabase client to avoid actual API calls during tests
jest.mock('@/integrations/supabase/client', () => {
  // Create a shared mock data store across mocked methods
  const mockData = {
    profiles: []
  };

  return {
    supabase: {
      from: (table) => {
        // Initialize table if not exists
        if (!mockData[table]) {
          mockData[table] = [];
        }

        return {
          select: jest.fn().mockReturnValue({
            execute: jest.fn().mockImplementation(() => {
              return Promise.resolve({ 
                data: mockData[table] || [], 
                error: null 
              });
            }),
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockImplementation(() => {
                if (table === 'profiles' && mockData[table] && mockData[table].length > 0) {
                  return Promise.resolve({ data: mockData[table][0], error: null });
                }
                return Promise.resolve({ data: {}, error: null });
              }),
              maybeSingle: jest.fn().mockReturnValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockImplementation((data) => {
            // Handle array or single item
            const items = Array.isArray(data) ? data : [data];
            
            // Add items to mock data with defaults
            items.forEach(item => {
              const newItem = {
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              mockData[table].push(newItem);
            });
            
            return {
              execute: jest.fn().mockReturnValue({ 
                data: items.length === 1 ? items[0] : items, 
                error: null 
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
              }
              return {
                execute: jest.fn().mockReturnValue({ data: null, error: null }),
              };
            }),
          }),
        };
      },
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
  // Create test data
  const mockProfiles = Array(3).fill(null).map(() => createMockProfile());
  
  // Create a test context for profiles
  const profileContext = createTestContext<Profile>('profiles', {
    initialData: mockProfiles,
    mockDataInTestEnv: true
  });

  // Set up and clean up for each test
  beforeEach(() => profileContext.setup({ initialData: mockProfiles }));
  afterEach(() => profileContext.cleanup());

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
    await repository.insert(newProfile).execute();
    
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
  afterAll(() => profileContext.release());
});
