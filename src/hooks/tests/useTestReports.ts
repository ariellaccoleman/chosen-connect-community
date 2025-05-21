
import { useQuery } from '@tanstack/react-query';
import { getAllTestRuns, getTestRunById, getTestResultsByRunId } from '@/api/tests';

/**
 * Hook to fetch all test runs
 */
export const useTestRuns = () => {
  return useQuery({
    queryKey: ['testRuns'],
    queryFn: async () => {
      const response = await getAllTestRuns();
      return response.data || [];
    }
  });
};

/**
 * Hook to fetch a specific test run by ID
 */
export const useTestRunDetails = (testRunId?: string) => {
  return useQuery({
    queryKey: ['testRun', testRunId],
    queryFn: async () => {
      if (!testRunId) throw new Error('Test run ID is required');
      const response = await getTestRunById(testRunId);
      return response.data;
    },
    enabled: !!testRunId
  });
};

/**
 * Hook to fetch test results for a specific run
 */
export const useTestResults = (testRunId?: string) => {
  return useQuery({
    queryKey: ['testResults', testRunId],
    queryFn: async () => {
      if (!testRunId) throw new Error('Test run ID is required');
      const response = await getTestResultsByRunId(testRunId);
      return response.data || [];
    },
    enabled: !!testRunId
  });
};

/**
 * Group test results by test suite
 */
export const groupTestResultsBySuite = (testResults = []) => {
  return testResults.reduce((acc, result) => {
    const suite = result.test_suite || 'Uncategorized';
    if (!acc[suite]) {
      acc[suite] = [];
    }
    acc[suite].push(result);
    return acc;
  }, {});
};

/**
 * Calculate the overall success rate for a list of test runs
 */
export const calculateSuccessRate = (testRuns = []) => {
  if (testRuns.length === 0) return 0;
  
  const successfulRuns = testRuns.filter(run => run.status === 'success').length;
  return (successfulRuns / testRuns.length) * 100;
};
