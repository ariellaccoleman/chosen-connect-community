
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../utils/persistentTestUsers';

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
    } else {
      // If no TEST_SUPABASE_URL, we're using fallback
      console.log('⚠️ Using fallback project - recommend setting TEST_SUPABASE_URL');
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

  test('should be able to connect to test database', async () => {
    const anonClient = TestClientFactory.getAnonClient();
    expect(anonClient).toBeTruthy();
    
    // Test basic database connectivity
    try {
      const { data, error } = await anonClient
        .from('profiles')
        .select('id')
        .limit(1);
      
      console.log('Database connection result:', {
        error: error?.message || null,
        hasData: !!data,
        dataLength: data?.length || 0
      });
      
      // Should work (might return empty results due to RLS, but no connection error)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  });

  test('should have service role client available for setup/teardown', () => {
    // Test that we can get a service role client
    // This is needed for test data setup and cleanup
    const serviceClient = TestClientFactory.getServiceRoleClient();
    expect(serviceClient).toBeTruthy();
    
    // Log whether we have proper service role key
    const hasServiceKey = !!(process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Service role key available:', hasServiceKey);
    
    if (!hasServiceKey) {
      console.warn('⚠️ No service role key - some test operations may be limited');
    }
  });

  test('should provide persistent test user guidance', () => {
    // This test documents the approach for persistent test users
    console.log('📋 Persistent Test Users Setup Guide:');
    console.log('1. Manually create 3 test users in your test Supabase project:');
    console.log('   - testuser1@example.com (password: TestPass123!)');
    console.log('   - testuser2@example.com (password: TestPass123!)'); 
    console.log('   - testuser3@example.com (password: TestPass123!)');
    console.log('2. These users should have confirmed emails and be ready for authentication');
    console.log('3. Tests will use TestClientFactory.createAuthenticatedClient() to authenticate as these users');
    console.log('4. No dynamic user creation needed - persistent users provide stable test environment');
    
    // Test passes - this is just documentation
    expect(true).toBe(true);
  });
});
