
import { useQuery } from '@tanstack/react-query';
import * as testAPI from '@/api/tests/testApi';

/**
 * Hook to fetch all test runs
 */
export const useTestRuns = () => {
  return useQuery({
    queryKey: ['testRuns'],
    queryFn: async () => {
      return await testAPI.getAllTestRuns();
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
      return await testAPI.getTestRunById(testRunId);
    },
    enabled: !!testRunId
  });
};

/**
 * Hook to fetch test suites for a specific run
 */
export const useTestSuites = (testRunId?: string) => {
  return useQuery({
    queryKey: ['testSuites', testRunId],
    queryFn: async () => {
      if (!testRunId) throw new Error('Test run ID is required');
      return await testAPI.getTestSuitesByRunId(testRunId);
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
      return await testAPI.getTestResultsByRunId(testRunId);
    },
    enabled: !!testRunId
  });
};

/**
 * Hook to fetch test results for a specific suite
 */
export const useTestResultsBySuite = (suiteId?: string) => {
  return useQuery({
    queryKey: ['testResultsBySuite', suiteId],
    queryFn: async () => {
      if (!suiteId) throw new Error('Suite ID is required');
      return await testAPI.getTestResultsBySuiteId(suiteId);
    },
    enabled: !!suiteId
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
