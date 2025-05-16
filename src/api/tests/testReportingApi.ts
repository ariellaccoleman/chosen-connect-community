
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Tables } from '@/integrations/supabase/types';
import { apiClient } from '@/api/core/apiClient';

type TestRun = Tables<'test_runs'>;
type TestResult = Tables<'test_results'>;

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
 * Get all test runs
 */
export const getAllTestRuns = async (): Promise<TestRun[]> => {
  try {
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
 * Get test run by ID
 */
export const getTestRunById = async (testRunId: string): Promise<TestRun | null> => {
  try {
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
 * Get test results for a specific test run
 */
export const getTestResultsByRunId = async (testRunId: string): Promise<TestResult[]> => {
  try {
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
 * Get recent failed tests
 */
export const getRecentFailedTests = async (limit = 20): Promise<TestResult[]> => {
  try {
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
