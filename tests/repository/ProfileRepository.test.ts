
import { createTestingProfileRepository } from '@/api/core/repository/entities/factories/profileRepositoryFactory';
import { setupTestSchema, clearTestTable, seedTestData } from '@/api/core/testing/schemaBasedTesting';
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
        update: () => ({
          eq: () => ({
            execute: jest.fn().mockReturnValue({ data: {}, error: null }),
          }),
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

describe('ProfileRepository with Schema-Based Testing', () => {
  // Set up the testing schema before all tests
  beforeAll(async () => {
    await setupTestSchema();
  });

  // Clear the profiles table before each test
  beforeEach(async () => {
    await clearTestTable('profiles');
  });

  test('should create and retrieve a profile', async () => {
    // Create a repository using the testing schema
    const profileRepo = createTestingProfileRepository();
    
    // Create a mock profile
    const mockProfile = createMockProfile();
    
    // Insert the profile
    const insertResult = await profileRepo.getBaseRepository().insert(mockProfile).execute();
    
    // Verify insertion was successful
    expect(insertResult.error).toBeNull();
    expect(insertResult.data).toBeTruthy();
    
    // Retrieve the profile
    const retrieveResult = await profileRepo.getBaseRepository()
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
    // Create a repository
    const profileRepo = createTestingProfileRepository();
    
    // Create and seed a mock profile
    const mockProfile = createMockProfile();
    await seedTestData<Profile>('profiles', [mockProfile]);
    
    // Update the profile
    const updatedName = 'Updated Name';
    const updateResult = await profileRepo.getBaseRepository()
      .update({ first_name: updatedName })
      .eq('id', mockProfile.id)
      .execute();
    
    // Verify update was successful
    expect(updateResult.error).toBeNull();
    
    // Retrieve the updated profile
    const retrieveResult = await profileRepo.getBaseRepository()
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
    // Create a repository
    const profileRepo = createTestingProfileRepository();
    
    // Create and seed a mock profile
    const mockProfile = createMockProfile();
    await seedTestData<Profile>('profiles', [mockProfile]);
    
    // Delete the profile
    const deleteResult = await profileRepo.getBaseRepository()
      .delete()
      .eq('id', mockProfile.id)
      .execute();
    
    // Verify deletion was successful
    expect(deleteResult.error).toBeNull();
    
    // Try to retrieve the deleted profile
    const retrieveResult = await profileRepo.getBaseRepository()
      .select()
      .eq('id', mockProfile.id)
      .maybeSingle();
    
    // Verify the profile no longer exists
    expect(retrieveResult.data).toBeNull();
  });

  // Clean up after all tests
  afterAll(async () => {
    await clearTestTable('profiles');
  });
});
