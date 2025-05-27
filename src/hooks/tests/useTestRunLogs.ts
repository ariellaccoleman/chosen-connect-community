
import { useQuery } from '@tanstack/react-query';
import { getTestRunLogs } from '@/api/tests/testReportingApi';

export const useTestRunLogs = (testRunId: string | undefined) => {
  return useQuery({
    queryKey: ['testRunLogs', testRunId],
    queryFn: () => getTestRunLogs(testRunId!),
    enabled: !!testRunId,
    refetchInterval: false, // Don't auto-refetch logs
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};
