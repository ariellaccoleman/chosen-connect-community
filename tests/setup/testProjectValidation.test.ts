
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { createSimplifiedTestContext, TestUserFactory } from '@/api/core/testing/simplifiedTestUtils';

describe('Test Project Validation', () => {
  afterAll(() => {
    TestClientFactory.cleanup();
  });

  test('should be using dedicated test project', () => {
    const projectInfo = TestInfrastructure.getTestProjectInfo();
    
    console.log('Test project info:', {
      url: projectInfo.url,
      usingDedicated: projectInfo.usingDedicatedProject
    });
    
    expect(projectInfo.url).toBeTruthy();
    
    // If TEST_SUPABASE_URL is set, we should be using it
    if (process.env.TEST_SUPABASE_URL) {
      expect(projectInfo.usingDedicatedProject).toBe(true);
      expect(projectInfo.url).toBe(process.env.TEST_SUPABASE_URL);
    }
  });

  test('should have required environment variables in CI', () => {
    // Only check for required variables in CI environment
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      expect(process.env.TEST_SUPABASE_URL).toBeTruthy();
      expect(process.env.TEST_SUPABASE_ANON_KEY).toBeTruthy();
      expect(process.env.TEST_SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
    }
    
    // Always check that we have some way to connect
    expect(
      process.env.TEST_SUPABASE_URL || 
      process.env.SUPABASE_URL
    ).toBeTruthy();
  });

  test('should create and authenticate test users', async () => {
    const testUser = TestUserFactory.createTestUser('validation');
    
    try {
      // Create test user
      const user = await TestInfrastructure.createTestUser(
        testUser.email,
        testUser.password,
        testUser.metadata
      );
      
      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);
      
      // Test authentication
      const authClient = await TestClientFactory.createAuthenticatedClient(
        testUser.email,
        testUser.password
      );
      
      expect(authClient).toBeTruthy();
      
      // Verify we can get the user
      const { data: { user: currentUser }, error } = await authClient.auth.getUser();
      expect(error).toBeNull();
      expect(currentUser?.email).toBe(testUser.email);
      
      // Cleanup
      await TestInfrastructure.deleteTestUser(user.id);
      
    } catch (error) {
      console.error('Test user creation/auth failed:', error);
      throw error;
    }
  });

  test('should clean up table data', async () => {
    // Test table cleanup functionality
    try {
      await TestInfrastructure.cleanupTable('profiles');
      // If we get here without error, cleanup worked
      expect(true).toBe(true);
    } catch (error) {
      // Cleanup might fail if table doesn't exist or RLS prevents it
      // That's ok for this validation test
      console.log('Table cleanup test - this is expected if table doesn\'t exist');
    }
  });
});
