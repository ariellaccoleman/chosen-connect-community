
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useTestRunDetails, 
  useTestResults, 
  groupTestResultsBySuite 
} from '@/hooks/tests/useTestReports';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  GitBranch, 
  GitCommit,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from "sonner";

const AdminTestRunDetail = () => {
  const { testRunId } = useParams<{ testRunId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const { 
    data: testRun, 
    isLoading: isLoadingRun, 
    error: runError 
  } = useTestRunDetails(testRunId);
  
  const { 
    data: testResults, 
    isLoading: isLoadingResults, 
    error: resultsError 
  } = useTestResults(testRunId);

  if (runError || resultsError) {
    toast.error("Failed to load test run details");
  }

  const isLoading = isLoadingRun || isLoadingResults;

  // Group test results by suite
  const resultsBySuite = React.useMemo(() => {
    return groupTestResultsBySuite(testResults || []);
  }, [testResults]);

  // Filter results based on active tab
  const filteredResults = React.useMemo(() => {
    if (!testResults) return [];
    
    switch (activeTab) {
      case 'failed':
        return testResults.filter(result => result.status === 'failed');
      case 'passed':
        return testResults.filter(result => result.status === 'passed');
      case 'skipped':
        return testResults.filter(result => result.status === 'skipped');
      default:
        return testResults;
    }
  }, [testResults, activeTab]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Passed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Skipped</Badge>;
      default:
        return null;
    }
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
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate('/admin/tests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold font-heading">Test Run Details</h1>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : testRun ? (
        <>
          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <div className="flex items-center">
                {renderStatusIcon(testRun.status)}
                <span className="text-xl ml-2 font-semibold">
                  {testRun.status === 'success' ? 'Success' : testRun.status === 'failure' ? 'Failed' : 'In Progress'}
                </span>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Date</h3>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <div className="text-base font-medium">
                    {testRun.run_at ? format(new Date(testRun.run_at), 'PPP') : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testRun.run_at ? format(new Date(testRun.run_at), 'p') : ''}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Test Results</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-semibold text-green-600">{testRun.passed_tests}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-red-600">{testRun.failed_tests}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-yellow-600">{testRun.skipped_tests}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Code Info</h3>
              {testRun.git_branch ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm truncate">{testRun.git_branch}</span>
                  </div>
                  <div className="flex items-center">
                    <GitCommit className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-mono truncate">
                      {testRun.git_commit ? testRun.git_commit.substring(0, 10) : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No Git info available</div>
              )}
            </Card>
          </div>
          
          <Card className="mb-8">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="p-4 border-b">
                <TabsList>
                  <TabsTrigger value="all">
                    All Tests ({testResults?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="failed">
                    Failed ({testResults?.filter(r => r.status === 'failed').length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="passed">
                    Passed ({testResults?.filter(r => r.status === 'passed').length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="skipped">
                    Skipped ({testResults?.filter(r => r.status === 'skipped').length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="p-0 m-0">
                <div className="p-4">
                  {filteredResults.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(
                        groupTestResultsBySuite(filteredResults)
                      ).map(([suite, results]) => (
                        <AccordionItem key={suite} value={suite}>
                          <AccordionTrigger className="px-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>{suite}</span>
                              <div className="flex space-x-2">
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  {results.filter(r => r.status === 'passed').length} Passed
                                </Badge>
                                {results.some(r => r.status === 'failed') && (
                                  <Badge variant="outline" className="bg-red-100 text-red-800">
                                    {results.filter(r => r.status === 'failed').length} Failed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">Status</TableHead>
                                  <TableHead>Test Name</TableHead>
                                  <TableHead className="w-[100px] text-right">Duration</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.map((result) => (
                                  <TableRow 
                                    key={result.id}
                                    className={
                                      result.status === 'failed' ? 'bg-red-50 hover:bg-red-100' : ''
                                    }
                                  >
                                    <TableCell>{renderStatusBadge(result.status)}</TableCell>
                                    <TableCell>{result.test_name}</TableCell>
                                    <TableCell className="text-right">
                                      {(result.duration_ms / 1000).toFixed(2)}s
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No test results found matching the selected filter.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
          
          {filteredResults.filter(r => r.status === 'failed').length > 0 && (
            <Card>
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  Failed Tests Details
                </h2>
              </div>
              
              <div className="p-4">
                <Accordion type="multiple" className="w-full">
                  {filteredResults
                    .filter(r => r.status === 'failed')
                    .map((result) => (
                      <AccordionItem key={result.id} value={result.id}>
                        <AccordionTrigger className="px-4">
                          <div className="flex items-center text-left">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="font-medium">
                              {result.test_suite} - {result.test_name}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 space-y-4">
                          {result.error_message && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-red-600">Error Message</h4>
                              <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 font-mono text-sm whitespace-pre-wrap">
                                {result.error_message}
                              </div>
                            </div>
                          )}
                          
                          {result.stack_trace && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Stack Trace</h4>
                              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm overflow-x-auto whitespace-pre">
                                {result.stack_trace}
                              </div>
                            </div>
                          )}
                          
                          {result.console_output && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center">
                                <Terminal className="h-4 w-4 mr-1" />
                                Console Output
                              </h4>
                              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm overflow-x-auto whitespace-pre">
                                {result.console_output}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Test Run Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The test run you're looking for doesn't exist or may have been removed.
          </p>
          <Button 
            variant="default" 
            onClick={() => navigate('/admin/tests')}
          >
            Back to Test Reports
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminTestRunDetail;
