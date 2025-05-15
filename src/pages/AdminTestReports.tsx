
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestRuns, calculateSuccessRate } from '@/hooks/tests/useTestReports';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Check,
  X,
  Clock,
  ArrowUpDown,
  Calendar,
  GitBranch,
  GitCommit,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";

const AdminTestReports = () => {
  const navigate = useNavigate();
  const { data: testRuns, isLoading, error } = useTestRuns();
  const [sortField, setSortField] = useState<string>('run_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (error) {
    toast.error("Failed to load test reports");
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedRuns = React.useMemo(() => {
    if (!testRuns) return [];
    
    return [...testRuns].sort((a, b) => {
      const valueA = a[sortField as keyof typeof a];
      const valueB = b[sortField as keyof typeof b];
      
      if (valueA === null) return sortOrder === 'asc' ? -1 : 1;
      if (valueB === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      return sortOrder === 'asc' 
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    });
  }, [testRuns, sortField, sortOrder]);

  const successRate = React.useMemo(() => {
    return calculateSuccessRate(testRuns || []);
  }, [testRuns]);

  const handleRowClick = (testRunId: string) => {
    navigate(`/admin/tests/${testRunId}`);
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <X className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-heading">Test Reports</h1>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-semibold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${successRate.toFixed(1)}%`
                )}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Test Runs</p>
              <p className="text-2xl font-semibold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  testRuns?.length || 0
                )}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <X className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Failures</p>
              <p className="text-2xl font-semibold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  testRuns?.filter(run => run.status === 'failure').length || 0
                )}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Latest Branch</p>
              <p className="text-xl font-semibold truncate max-w-[150px]">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  sortedRuns[0]?.git_branch || 'N/A'
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('run_at')}>
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('total_tests')}>
                <div className="flex items-center">
                  Tests
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('passed_tests')}>
                <div className="flex items-center">
                  Passed
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('failed_tests')}>
                <div className="flex items-center">
                  Failed
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('duration_ms')}>
                <div className="flex items-center">
                  Duration
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Commit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))
            ) : sortedRuns.length > 0 ? (
              sortedRuns.map((run) => (
                <TableRow 
                  key={run.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(run.id)}
                >
                  <TableCell>{renderStatusIcon(run.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {run.run_at ? formatDistanceToNow(new Date(run.run_at), { addSuffix: true }) : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{run.total_tests}</TableCell>
                  <TableCell className="text-green-600">{run.passed_tests}</TableCell>
                  <TableCell className="text-red-600">{run.failed_tests}</TableCell>
                  <TableCell>{(run.duration_ms / 1000).toFixed(2)}s</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[100px]">{run.git_branch || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <GitCommit className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[100px]">{run.git_commit ? run.git_commit.substring(0, 7) : 'N/A'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No test runs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminTestReports;
