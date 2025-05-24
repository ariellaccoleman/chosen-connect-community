
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

    // Test 1: Basic RPC call that should return data
    const test1 = await runTest('Direct SELECT query', async () => {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: 'SELECT 1 as test_value, \'hello\' as message'
      });
      if (error) throw error;
      return data;
    });
    testResults.push(test1);

    // Test 2: Test pg_get_tabledef function
    const test2 = await runTest('pg_get_tabledef function', async () => {
      const { data, error } = await supabase.rpc('pg_get_tabledef', {
        p_schema: 'public',
        p_table: 'profiles'
      });
      if (error) throw error;
      return data ? data.substring(0, 100) + '...' : 'No DDL returned';
    });
    testResults.push(test2);

    // Test 3: Check if testing schema exists
    const test3 = await runTest('Check testing schema', async () => {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: 'SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'testing\''
      });
      if (error) throw error;
      return data;
    });
    testResults.push(test3);

    // Test 4: List all available RPC functions
    const test4 = await runTest('List RPC functions', async () => {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT routine_name, routine_type 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name LIKE '%exec%'
          ORDER BY routine_name
        `
      });
      if (error) throw error;
      return data;
    });
    testResults.push(test4);

    setResults(testResults);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Schema Function Testing</CardTitle>
        <CardDescription>
          Test the core schema functions to debug any issues
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

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200">Debugging Info:</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            The issue you're experiencing suggests that the `exec_sql` function is returning `void` instead of data. 
            This component will help us understand what's happening with the RPC functions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
