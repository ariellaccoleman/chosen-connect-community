
import { TestClientFactory } from '@/integrations/supabase/testClient';

describe('Database Connection Validation', () => {
  afterAll(() => {
    TestClientFactory.cleanup();
  });

  test('Test environment is properly detected', () => {
    console.log('=== Environment Detection Test ===');
    
    // Test that we're in a test environment
    expect(process.env.NODE_ENV).toBe('test');
    
    // Log environment indicators for debugging
    const envIndicators = {
      NODE_ENV: process.env.NODE_ENV,
      JEST_WORKER_ID: process.env.JEST_WORKER_ID,
      TEST_RUN_ID: process.env.TEST_RUN_ID,
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      isTest: process.env.NODE_ENV === 'test'
    };
    
    console.log('Environment indicators:', envIndicators);
    expect(envIndicators.isTest).toBe(true);
  });

  test('Database connection works in test environment', async () => {
    console.log('=== Database Connection Test ===');
    
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

  test('Test project configuration is correct', () => {
    console.log('=== Test Project Configuration ===');
    
    const projectInfo = TestClientFactory.getTestProjectInfo();
    
    console.log('Project configuration:', {
      url: projectInfo.url,
      usingDedicatedProject: projectInfo.usingDedicatedProject
    });
    
    expect(projectInfo.url).toBeTruthy();
    expect(typeof projectInfo.usingDedicatedProject).toBe('boolean');
  });
});
