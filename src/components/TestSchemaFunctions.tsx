
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  test: string;
  success: boolean;
  result?: any;
  error?: string;
}

// Runtime function to detect test environment with comprehensive checks
const isTestEnvironment = (): boolean => {
  // Check if we're in Node.js environment first
  if (typeof window !== "undefined" || typeof process === "undefined") {
    return false;
  }

  const checks = {
    NODE_ENV: process.env.NODE_ENV === 'test',
    JEST_WORKER_ID: typeof process.env.JEST_WORKER_ID !== 'undefined',
    TEST_RUN_ID: typeof process.env.TEST_RUN_ID !== 'undefined',
    CI: process.env.CI === 'true',
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
    hasJestArg: process.argv.some(arg => arg.includes('jest')),
    hasCoverage: typeof (global as any).__coverage__ !== 'undefined'
  };

  // Return true if any test environment indicator is present
  return Object.values(checks).some(check => check === true);
};

export function TestSchemaFunctions() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      return { test: testName, success: true, result };
    } catch (error) {
      return { 
        test: testName, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    const testResults: TestResult[] = [];

    // Check if we're in a proper test environment
    if (!isTestEnvironment()) {
      testResults.push({
        test: 'Environment Check',
        success: false,
        error: 'Test infrastructure can only run in Node.js/test environments. Environment detection failed - ensure CI=true, GITHUB_ACTIONS=true, or NODE_ENV=test is set.'
      });
      setResults(testResults);
      setIsLoading(false);
      return;
    }

    console.log('✅ Test environment detected successfully');

    try {
      // Dynamically import test infrastructure (only works in Node.js)
      const { TestInfrastructure, TestClientFactory } = await import('@/integrations/supabase/testClient');

      // Test 1: Test project connectivity
      const test1 = await runTest('Test project connectivity', async () => {
        const projectInfo = TestInfrastructure.getTestProjectInfo();
        return {
          url: projectInfo.url,
          usingDedicatedProject: projectInfo.usingDedicatedProject
        };
      });
      testResults.push(test1);

      // Test 2: Client factory functionality
      const test2 = await runTest('Client factory test', async () => {
        const anonClient = await TestClientFactory.getAnonClient();
        
        // Try to get service client, but handle gracefully if not available
        let serviceClientExists = false;
        let serviceClientError = null;
        try {
          const serviceClient = TestClientFactory.getServiceRoleClient();
          serviceClientExists = !!serviceClient;
        } catch (error) {
          serviceClientError = error instanceof Error ? error.message : 'Unknown error';
        }
        
        // Test basic connectivity with anon client
        const { data, error } = await anonClient
          .from('profiles')
          .select('id')
          .limit(1);
        
        return {
          anonClientWorks: !error,
          serviceClientExists,
          serviceClientError,
          queryError: error?.message || null
        };
      });
      testResults.push(test2);

      // Test 3: User management (only if service role key is available)
      const test3 = await runTest('User management test', async () => {
        // Check if service role key is available
        const hasServiceKey = !!(process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        if (!hasServiceKey) {
          return {
            skipped: true,
            reason: 'Service role key not available - this test requires TEST_SUPABASE_SERVICE_ROLE_KEY'
          };
        }

        const testUser = {
          email: `test_${Date.now()}@testproject.example`,
          password: 'TestPassword123!',
          metadata: { test: true }
        };

        try {
          // Create test user
          const user = await TestInfrastructure.createTestUser(
            testUser.email,
            testUser.password,
            testUser.metadata
          );

          // Clean up immediately
          await TestInfrastructure.deleteTestUser(user.id);

          return {
            userCreated: true,
            userDeleted: true,
            userId: user.id
          };
        } catch (error) {
          return {
            userCreated: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      testResults.push(test3);

      // Test 4: Table cleanup test (only if service role key is available)
      const test4 = await runTest('Table cleanup test', async () => {
        const hasServiceKey = !!(process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        if (!hasServiceKey) {
          return {
            skipped: true,
            reason: 'Service role key not available - this test requires TEST_SUPABASE_SERVICE_ROLE_KEY'
          };
        }

        await TestInfrastructure.cleanupTable('profiles');
        return {
          message: 'Table cleanup completed (check console for details)'
        };
      });
      testResults.push(test4);

    } catch (importError) {
      testResults.push({
        test: 'Import Test Infrastructure',
        success: false,
        error: `Failed to import test infrastructure: ${importError instanceof Error ? importError.message : 'Unknown error'}`
      });
    }

    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Simplified Test Infrastructure Testing</CardTitle>
        <CardDescription>
          Test the new simplified test infrastructure with dedicated test project
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300 text-sm">
            ℹ️ Note: These tests are designed to run in CI environments (GitHub Actions) with proper environment variables set.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.test}</span>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                
                {result.success && result.result && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                    <strong>Result:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {typeof result.result === 'string' 
                        ? result.result 
                        : JSON.stringify(result.result, null, 2)
                      }
                    </pre>
                  </div>
                )}
                
                {!result.success && result.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm text-red-700 dark:text-red-300">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200">Simplified Architecture Benefits:</h4>
          <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
            <li>✅ Uses dedicated test Supabase project</li>
            <li>✅ No complex schema manipulation needed</li>
            <li>✅ Real database behavior for testing</li>
            <li>✅ Clean separation between test and production</li>
            <li>✅ Simple user management for tests</li>
            <li>✅ Easy cleanup and seeding</li>
            <li>✅ Type-safe database operations</li>
          </ul>
          
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-300 text-sm">
            <strong>Note:</strong> Some tests require the TEST_SUPABASE_SERVICE_ROLE_KEY environment variable. 
            Tests that require this key will be skipped if it's not available, but basic connectivity tests will still run.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
