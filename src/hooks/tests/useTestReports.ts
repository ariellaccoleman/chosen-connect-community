
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { 
  getAllTestRuns, 
  getTestRunById, 
  getTestResultsByRunId,
  getRecentFailedTests
} from '@/api/tests/testReportingApi';
import { logger } from '@/utils/logger';

type TestRun = Tables<'test_runs'>;
type TestResult = Tables<'test_results'>;

/**
 * Hook to fetch all test runs
 */
export const useTestRuns = () => {
  return useQuery({
    queryKey: ['test-runs'],
    queryFn: getAllTestRuns,
  });
};

/**
 * Hook to fetch a specific test run by ID
 */
export const useTestRunDetails = (testRunId: string | undefined) => {
  return useQuery({
    queryKey: ['test-run', testRunId],
    queryFn: () => testRunId ? getTestRunById(testRunId) : Promise.resolve(null),
    enabled: !!testRunId,
  });
};

/**
 * Hook to fetch test results for a specific run
 */
export const useTestResults = (testRunId: string | undefined) => {
  return useQuery({
    queryKey: ['test-results', testRunId],
    queryFn: () => testRunId ? getTestResultsByRunId(testRunId) : Promise.resolve([]),
    enabled: !!testRunId,
  });
};

/**
 * Hook to fetch recent failed tests
 */
export const useRecentFailedTests = (limit = 20) => {
  return useQuery({
    queryKey: ['failed-tests', limit],
    queryFn: () => getRecentFailedTests(limit),
  });
};

/**
 * Calculate success rate from test run data
 */
export const calculateSuccessRate = (testRuns: TestRun[]): number => {
  if (!testRuns || testRuns.length === 0) return 0;
  
  const totalRuns = testRuns.length;
  const successfulRuns = testRuns.filter(run => run.status === 'success').length;
  
  return (successfulRuns / totalRuns) * 100;
};

/**
 * Group test results by suite
 */
export const groupTestResultsBySuite = (results: TestResult[]): Record<string, TestResult[]> => {
  return results.reduce((groups, result) => {
    const suite = result.test_suite;
    if (!groups[suite]) {
      groups[suite] = [];
    }
    groups[suite].push(result);
    return groups;
  }, {} as Record<string, TestResult[]>);
};
