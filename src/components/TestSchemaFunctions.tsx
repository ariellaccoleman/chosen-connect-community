
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

    // Check if we're in a browser environment and warn
    if (typeof window !== "undefined") {
      testResults.push({
        test: 'Environment Check',
        success: false,
        error: 'Test infrastructure can only run in Node.js/test environments, not in the browser'
      });
      setResults(testResults);
      setIsLoading(false);
      return;
    }

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
        const anonClient = TestClientFactory.getAnonClient();
        const serviceClient = TestClientFactory.getServiceRoleClient();
        
        // Test basic connectivity with anon client
        const { data, error } = await anonClient
          .from('profiles')
          .select('id')
          .limit(1);
        
        return {
          anonClientWorks: !error,
          serviceClientExists: !!serviceClient,
          queryError: error?.message || null
        };
      });
      testResults.push(test2);

      // Test 3: User management
      const test3 = await runTest('User management test', async () => {
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

      // Test 4: Table cleanup test
      const test4 = await runTest('Table cleanup test', async () => {
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
          {typeof window !== "undefined" && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-300 text-sm">
              ⚠️ Note: These tests are designed to run in Node.js/test environments, not in the browser.
            </div>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
