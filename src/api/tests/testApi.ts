
import { apiClient } from '@/api/core/apiClient';
import { ApiResponse } from '@/api/core/errorHandler';
import { Tables } from '@/integrations/supabase/types';

export type TestRun = Tables<'test_runs'>;
export type TestResult = Tables<'test_results'>;
export type TestSuite = Tables<'test_suites'>;

/**
 * Fetch all test runs
 */
export const getAllTestRuns = async (): Promise<ApiResponse<TestRun[]>> => {
  return apiClient.query((supabase) => 
    supabase
      .from('test_runs')
      .select('*')
      .order('run_at', { ascending: false })
  );
};

/**
 * Fetch a specific test run by ID
 */
export const getTestRunById = async (id: string): Promise<ApiResponse<TestRun>> => {
  return apiClient.query((supabase) => 
    supabase
      .from('test_runs')
      .select('*')
      .eq('id', id)
      .maybeSingle()
  );
};

/**
 * Fetch all test suites for a specific run
 */
export const getTestSuitesByRunId = async (runId: string): Promise<ApiResponse<TestSuite[]>> => {
  return apiClient.query((supabase) => 
    supabase
      .from('test_suites')
      .select('*')
      .eq('test_run_id', runId)
      .order('file_path', { ascending: true })
  );
};

/**
 * Fetch all test results for a specific run
 */
export const getTestResultsByRunId = async (runId: string): Promise<ApiResponse<TestResult[]>> => {
  return apiClient.query((supabase) => 
    supabase
      .from('test_results')
      .select('*')
      .eq('test_run_id', runId)
      .order('test_suite', { ascending: true })
  );
};

/**
 * Fetch all test results for a specific suite
 */
export const getTestResultsBySuiteId = async (suiteId: string): Promise<ApiResponse<TestResult[]>> => {
  return apiClient.query((supabase) => 
    supabase
      .from('test_results')
      .select('*')
      .eq('test_suite_id', suiteId)
      .order('test_name', { ascending: true })
  );
};
