
import { createApiFactory } from '../core/factory/apiFactory';
import { apiClient } from '../core/apiClient';
import { ApiResponse, createSuccessResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';
import { Tables } from '@/integrations/supabase/types';

// Define types from the database schema
type TestRun = Tables<'test_runs'>;
type TestResult = Tables<'test_results'>;

/**
 * Create API operations for test runs using the factory pattern
 */
export const testRunsApi = createApiFactory<TestRun, string, Partial<TestRun>, Partial<TestRun>, 'test_runs'>(
  {
    tableName: 'test_runs',
    entityName: 'testRun',
    defaultOrderBy: 'run_at',
    defaultSelect: '*',
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: false
  }
);

/**
 * Create API operations for test results using the factory pattern
 */
export const testResultsApi = createApiFactory<TestResult, string, Partial<TestResult>, Partial<TestResult>, 'test_results'>(
  {
    tableName: 'test_results',
    entityName: 'testResult',
    defaultOrderBy: 'created_at',
    defaultSelect: '*',
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: false
  }
);

// Export individual operations for direct usage
export const {
  getAll: getAllTestRuns,
  getById: getTestRunById,
} = testRunsApi;

export const {
  getAll: getAllTestResults,
  getById: getTestResultById,
} = testResultsApi;

/**
 * Create a new test run in the database
 */
export const createTestRun = async (): Promise<string | null> => {
  try {
    // Get git information if available (only in CI environment)
    const gitCommit = process.env.GITHUB_SHA || null;
    const gitBranch = process.env.GITHUB_REF_NAME || null;
    
    // Call the create-run endpoint
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
 * Save test result to the database
 */
export const saveTestResult = async (
  testRunId: string,
  testSuite: string,
  testName: string,
  status: 'passed' | 'failed' | 'skipped',
  durationMs: number,
  errorMessage?: string,
  stackTrace?: string,
  consoleOutput?: string
): Promise<boolean> => {
  try {
    // Call the record-result endpoint
    const { error } = await apiClient.functionQuery((functions) => 
      functions.invoke('report-test-results/record-result', {
        method: 'POST',
        body: {
          test_run_id: testRunId,
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
 * Update test run with final results
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
    
    // Call the update-run endpoint
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
 * Get test results for a specific test run
 */
export const getTestResultsByRunId = async (testRunId: string): Promise<ApiResponse<TestResult[]>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from('test_results')
      .select('*')
      .eq('test_run_id', testRunId)
      .order('test_suite', { ascending: true });
    
    if (error) {
      logger.error('Error fetching test results:', error);
      throw error;
    }
    
    return createSuccessResponse(data || []);
  });
};

/**
 * Get recent failed tests
 */
export const getRecentFailedTests = async (limit = 20): Promise<ApiResponse<TestResult[]>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
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
      throw error;
    }
    
    return createSuccessResponse(data || []);
  });
};
