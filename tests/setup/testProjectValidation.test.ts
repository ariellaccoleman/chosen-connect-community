
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';

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
});
