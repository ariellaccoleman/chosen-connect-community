import { logger } from '@/utils/logger';
import { Tables } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type TestRun = Tables<'test_runs'>;
type TestResult = Tables<'test_results'>;
type TestSuite = Tables<'test_suites'>;

// Create a dedicated client for test reporting (always points to production)
const createProductionClient = () => {
  // In browser environment, use the regular production URLs
  if (typeof window !== 'undefined') {
    const prodUrl = "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
    const prodAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";
    
    return createClient<Database>(prodUrl, prodAnonKey);
  }
  
  // In Node.js environment (tests), use production environment variables
  const prodUrl = process.env.PROD_SUPABASE_URL || process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
  const prodAnonKey = process.env.PROD_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";
  
  return createClient<Database>(prodUrl, prodAnonKey);
};

// Get the production client for test reporting
const getProductionClient = () => {
  return createProductionClient();
};

// Create a function-based API client for edge function calls
const createFunctionApiClient = () => {
  const prodUrl = typeof window !== 'undefined' 
    ? "https://nvaqqkffmfuxdnwnqhxo.supabase.co"
    : process.env.PROD_SUPABASE_URL || process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
  
  return {
    functionQuery: async (callback: (functions: any) => any) => {
      const client = createProductionClient();
      return await callback(client.functions);
    }
  };
};

const apiClient = createFunctionApiClient();

/**
 * Create a new test run in the database (always in production)
 */
export const createTestRun = async (): Promise<string | null> => {
  try {
    // Get git information if available (only in CI environment)
    const gitCommit = process.env.GITHUB_SHA || null;
    const gitBranch = process.env.GITHUB_REF_NAME || null;
    
    // Call the create-run endpoint (always on production project)
    const { data, error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/create-run', {
        method: 'POST',
        body: {
          git_commit: gitCommit,
          git_branch: gitBranch,
        }
      })
    );
    
    if (error) {
      logger.error('Error creating test run:', error);
      return null;
    }
    
    return data.test_run_id;
  } catch (error) {
    logger.error('Exception creating test run:', error);
    return null;
  }
};

/**
 * Save test suite to the database (always in production)
 */
export const saveTestSuite = async (
  testRunId: string,
  suiteName: string,
  filePath: string,
  status: 'success' | 'failure' | 'skipped',
  testCount: number,
  durationMs: number,
  errorMessage?: string
): Promise<string | null> => {
  try {
    // Call the record-suite endpoint (always on production project)
    const { data, error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/record-suite', {
        method: 'POST',
        body: {
          test_run_id: testRunId,
          suite_name: suiteName,
          file_path: filePath,
          status,
          test_count: testCount,
          duration_ms: durationMs,
          error_message: errorMessage || null,
        }
      })
    );
    
    if (error) {
      logger.error('Error saving test suite:', error);
      return null;
    }
    
    return data.test_suite_id;
  } catch (error) {
    logger.error('Exception saving test suite:', error);
    return null;
  }
};

/**
 * Save test result to the database (always in production)
 */
export const saveTestResult = async (
  testRunId: string,
  testSuiteId: string | null,
  testSuite: string,
  testName: string,
  status: 'passed' | 'failed' | 'skipped',
  durationMs: number,
  errorMessage?: string,
  stackTrace?: string,
  consoleOutput?: string
): Promise<boolean> => {
  try {
    // Call the record-result endpoint (always on production project)
    const { error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/record-result', {
        method: 'POST',
        body: {
          test_run_id: testRunId,
          test_suite_id: testSuiteId,
          test_suite: testSuite,
          test_name: testName,
          status,
          duration_ms: durationMs,
          error_message: errorMessage || null,
          stack_trace: stackTrace || null,
          console_output: consoleOutput || null,
        }
      })
    );
    
    if (error) {
      logger.error('Error saving test result:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Exception saving test result:', error);
    return false;
  }
};

/**
 * Update test run with final results (always in production)
 * This is called once at the end of the test run with the final counts
 */
export const updateTestRunStatus = async (
  testRunId: string,
  totalTests: number,
  passedTests: number,
  failedTests: number,
  skippedTests: number,
  durationMs: number
): Promise<boolean> => {
  try {
    const status = failedTests > 0 ? 'failure' : 'success';
    
    // Call the update-run endpoint (always on production project)
    const { error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/update-run', {
        method: 'POST',
        body: {
          test_run_id: testRunId,
          total_tests: totalTests,
          passed_tests: passedTests,
          failed_tests: failedTests,
          skipped_tests: skippedTests,
          duration_ms: durationMs,
          status
        }
      })
    );
    
    if (error) {
      logger.error('Error updating test run status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Exception updating test run status:', error);
    return false;
  }
};

/**
 * Get all test runs (from production database)
 */
export const getAllTestRuns = async (): Promise<TestRun[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .order('run_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching test runs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching test runs:', error);
    return [];
  }
};

/**
 * Get test run by ID (from production database)
 */
export const getTestRunById = async (testRunId: string): Promise<TestRun | null> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('id', testRunId)
      .maybeSingle();
    
    if (error) {
      logger.error('Error fetching test run:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Exception fetching test run:', error);
    return null;
  }
};

/**
 * Get test suites for a specific test run (from production database)
 */
export const getTestSuitesByRunId = async (testRunId: string): Promise<TestSuite[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .eq('test_run_id', testRunId)
      .order('suite_name', { ascending: true });
    
    if (error) {
      logger.error('Error fetching test suites:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching test suites:', error);
    return [];
  }
};

/**
 * Get test results for a specific test run (from production database)
 */
export const getTestResultsByRunId = async (testRunId: string): Promise<TestResult[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_run_id', testRunId)
      .order('test_suite', { ascending: true });
    
    if (error) {
      logger.error('Error fetching test results:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching test results:', error);
    return [];
  }
};

/**
 * Get test results grouped by suite for a specific run (from production database)
 */
export const getTestResultsGroupedBySuite = async (testRunId: string): Promise<{
  suites: TestSuite[],
  results: Record<string, TestResult[]>
}> => {
  try {
    const [suites, results] = await Promise.all([
      getTestSuitesByRunId(testRunId),
      getTestResultsByRunId(testRunId)
    ]);
    
    // Group results by test_suite_id
    const resultsBySuite: Record<string, TestResult[]> = {};
    
    // Initialize with empty arrays for each suite
    suites.forEach(suite => {
      resultsBySuite[suite.id] = [];
    });
    
    // Populate with results
    results.forEach(result => {
      if (result.test_suite_id) {
        if (!resultsBySuite[result.test_suite_id]) {
          resultsBySuite[result.test_suite_id] = [];
        }
        resultsBySuite[result.test_suite_id].push(result);
      }
    });
    
    return {
      suites,
      results: resultsBySuite
    };
  } catch (error) {
    logger.error('Exception getting grouped test results:', error);
    return {
      suites: [],
      results: {}
    };
  }
};

/**
 * Get recent failed tests (from production database)
 */
export const getRecentFailedTests = async (limit = 20): Promise<TestResult[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_results')
      .select(`
        *,
        test_runs:test_run_id (
          run_at
        )
      `)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('Error fetching failed tests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching failed tests:', error);
    return [];
  }
};

/**
 * Get recent failed test suites (from production database)
 */
export const getRecentFailedSuites = async (limit = 20): Promise<TestSuite[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_suites')
      .select(`
        *,
        test_runs:test_run_id (
          run_at
        )
      `)
      .eq('status', 'failure')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('Error fetching failed suites:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching failed suites:', error);
    return [];
  }
};

/**
 * Get test run logs (from production database)
 */
export const getTestRunLogs = async (testRunId: string): Promise<any[]> => {
  try {
    const supabase = getProductionClient();
    const { data, error } = await supabase
      .from('test_run_logs')
      .select('*')
      .eq('test_run_id', testRunId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      logger.error('Error fetching test run logs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Exception fetching test run logs:', error);
    return [];
  }
};

/**
 * Save test run logs (always in production)
 */
export const saveTestRunLogs = async (
  testRunId: string,
  logs: Array<{
    timestamp: string;
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    source?: string;
    message: string;
  }>
): Promise<boolean> => {
  try {
    // Call the record-logs endpoint (always on production project)
    const { error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/record-logs', {
        method: 'POST',
        body: {
          test_run_id: testRunId,
          logs
        }
      })
    );
    
    if (error) {
      logger.error('Error saving test run logs:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Exception saving test run logs:', error);
    return false;
  }
};
