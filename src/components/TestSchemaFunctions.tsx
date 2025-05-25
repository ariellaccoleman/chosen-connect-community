
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

      // Test 1: Schema validation using secure function
      const test1 = await runTest('Secure schema validation', async () => {
        const validation = await TestInfrastructure.validateSchema('public');
        return {
          schema: validation.schema_name,
          tableCount: validation.table_count,
          validatedAt: validation.validated_at
        };
      });
      testResults.push(test1);

      // Test 2: Test schema creation and deletion
      const test2 = await runTest('Test schema lifecycle', async () => {
        const schemaName = await TestInfrastructure.createTestSchema('function_test');
        const validation = await TestInfrastructure.validateSchema(schemaName);
        await TestInfrastructure.dropTestSchema(schemaName);
        
        return {
          created: schemaName,
          validated: validation.schema_name,
          tableCount: validation.table_count
        };
      });
      testResults.push(test2);

      // Test 3: Table info retrieval
      const test3 = await runTest('Table information retrieval', async () => {
        const tableInfo = await TestInfrastructure.getTableInfo('public', 'profiles');
        return {
          schema: tableInfo.schema_name,
          table: tableInfo.table_name,
          columnCount: tableInfo.columns?.length || 0
        };
      });
      testResults.push(test3);

      // Test 4: Client factory functionality
      const test4 = await runTest('Client factory test', async () => {
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
      testResults.push(test4);

      // Test 5: Security verification - ensure proper function access control
      const test5 = await runTest('Security verification', async () => {
        const serviceClient = TestClientFactory.getServiceRoleClient();
        
        try {
          // Test that secure functions work with service role
          const { data, error } = await serviceClient.rpc('validate_schema_structure', { 
            target_schema: 'public' 
          });
          
          return {
            secureFunctionsWorking: !error && !!data,
            message: error ? `Error: ${error.message}` : 'Secure functions accessible with proper credentials'
          };
        } catch (e) {
          return {
            secureFunctionsWorking: false,
            message: `Exception: ${e instanceof Error ? e.message : 'Unknown error'}`
          };
        }
      });
      testResults.push(test5);

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
        <CardTitle>Secure Schema Function Testing</CardTitle>
        <CardDescription>
          Test the new secure schema functions and verify security improvements
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
          {isLoading ? 'Running Security Tests...' : 'Run All Security Tests'}
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
          <h4 className="font-semibold text-green-800 dark:text-green-200">Security Improvements:</h4>
          <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
            <li>✅ Removed dangerous exec_sql function</li>
            <li>✅ Added secure schema validation with input sanitization</li>
            <li>✅ Implemented proper client separation for testing</li>
            <li>✅ Added RLS policies for test-related tables</li>
            <li>✅ Service role key only used for infrastructure setup</li>
            <li>✅ Application tests use anonymous key (production behavior)</li>
            <li>✅ Browser environment protection added</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
