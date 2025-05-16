
import { useQuery } from '@tanstack/react-query';
import { 
  getAllTestRuns, 
  getTestRunById, 
  getTestResultsByRunId,
  getRecentFailedTests
} from '@/api/tests';

/**
 * Hook to fetch all test runs
 */
export const useTestRuns = (options = {}) => {
  return useQuery({
    queryKey: ['testRuns'],
    queryFn: () => getAllTestRuns(),
    ...options
  });
};

/**
 * Hook to fetch a specific test run by ID
 */
export const useTestRunById = (testRunId: string | null | undefined, options = {}) => {
  return useQuery({
    queryKey: ['testRun', testRunId],
    queryFn: () => getTestRunById(testRunId as string),
    enabled: !!testRunId,
    ...options
  });
};

/**
 * Hook to fetch test results for a specific run
 */
export const useTestResultsByRunId = (testRunId: string | null | undefined, options = {}) => {
  return useQuery({
    queryKey: ['testResults', testRunId],
    queryFn: () => getTestResultsByRunId(testRunId as string),
    enabled: !!testRunId,
    ...options
  });
};

/**
 * Hook to fetch recent failed tests
 */
export const useRecentFailedTests = (limit = 20, options = {}) => {
  return useQuery({
    queryKey: ['failedTests', limit],
    queryFn: () => getRecentFailedTests(limit),
    ...options
  });
};
