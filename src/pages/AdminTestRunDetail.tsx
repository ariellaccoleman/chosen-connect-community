
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useTestRunDetails, 
  useTestResults,
  useTestSuites,
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
  Terminal,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from "sonner";
import { APP_ROUTES } from '@/config/routes';

// Collapsible test result row component
const TestResultRow = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasError = result.status === 'failed' && (result.error_message || result.stack_trace || result.console_output);
  
  return (
    <>
      <TableRow 
        className={
          result.status === 'failed' ? 'bg-red-50 hover:bg-red-100' : ''
        }
      >
        <TableCell>
          {result.status === 'passed' ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Passed</Badge>
          ) : result.status === 'failed' ? (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Failed</Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Skipped</Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center">
            {hasError && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 mr-2 h-5 w-5" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {result.test_name}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {(result.duration_ms / 1000).toFixed(2)}s
        </TableCell>
      </TableRow>
      
      {isExpanded && hasError && (
        <TableRow className="bg-red-50">
          <TableCell colSpan={3} className="p-4">
            <div className="space-y-4">
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
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// Test suite component
const TestSuiteItem = ({ suite, results = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!suite) return null;
  
  const hasError = suite.status === 'failure' && suite.error_message;
  const testsPassed = results.filter(r => r.status === 'passed').length;
  const testsFailed = results.filter(r => r.status === 'failed').length;
  const testsSkipped = results.filter(r => r.status === 'skipped').length;
  
  return (
    <Card className="mb-4 overflow-hidden border-l-4 border-l-transparent hover:border-l-gray-300">
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between ${
          suite.status === 'failure' ? 'bg-red-50' : suite.status === 'skipped' ? 'bg-yellow-50' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="mr-2">
            {suite.status === 'success' ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : suite.status === 'failure' ? (
              <X className="h-5 w-5 text-red-500" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          <div>
            <div className="font-medium flex items-center">
              <FileText className="h-4 w-4 mr-1 text-gray-500" />
              {suite.suite_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {suite.file_path}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-medium">
              {suite.test_count} tests
            </div>
            <div className="text-xs text-muted-foreground">
              {(suite.duration_ms / 1000).toFixed(2)}s
            </div>
          </div>
          <div className="flex space-x-2">
            {testsPassed > 0 && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {testsPassed} passed
              </Badge>
            )}
            {testsFailed > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {testsFailed} failed
              </Badge>
            )}
            {testsSkipped > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {testsSkipped} skipped
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t">
          {hasError && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-red-600">Suite Error</h4>
              <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800 font-mono text-sm whitespace-pre-wrap">
                {suite.error_message}
              </div>
            </div>
          )}
          
          {results.length > 0 ? (
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
                  <TestResultRow key={result.id} result={result} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No test results found for this suite.
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

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

  const {
    data: testSuites,
    isLoading: isLoadingSuites,
    error: suitesError
  } = useTestSuites(testRunId);

  if (runError || resultsError || suitesError) {
    toast.error("Failed to load test run details");
  }

  const isLoading = isLoadingRun || isLoadingResults || isLoadingSuites;

  // Group test results by suite
  const resultsBySuite = React.useMemo(() => {
    if (!testResults || !testResults.data) return {};
    
    // Group by test_suite_id if available, otherwise fall back to test_suite name
    return testResults.data.reduce((acc, result) => {
      const suiteKey = result.test_suite_id || result.test_suite;
      if (!acc[suiteKey]) {
        acc[suiteKey] = [];
      }
      acc[suiteKey].push(result);
      return acc;
    }, {});
  }, [testResults]);

  // Filter results based on active tab
  const filteredResults = React.useMemo(() => {
    if (!testResults || !testResults.data) return [];
    
    switch (activeTab) {
      case 'failed':
        return testResults.data.filter(result => result.status === 'failed');
      case 'passed':
        return testResults.data.filter(result => result.status === 'passed');
      case 'skipped':
        return testResults.data.filter(result => result.status === 'skipped');
      case 'suites':
        return testResults.data; // All results, but we'll handle differently in the UI
      default:
        return testResults.data;
    }
  }, [testResults, activeTab]);

  // Filter suites based on active tab
  const filteredSuites = React.useMemo(() => {
    if (!testSuites || !testSuites.data) return [];
    
    switch (activeTab) {
      case 'suites':
        return testSuites.data;
      case 'failed-suites':
        return testSuites.data.filter(suite => suite.status === 'failure');
      default:
        return [];
    }
  }, [testSuites, activeTab]);

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
          onClick={() => navigate(APP_ROUTES.TEST_REPORTS)}
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
      ) : testRun?.data ? (
        <>
          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <div className="flex items-center">
                {renderStatusIcon(testRun.data.status)}
                <span className="text-xl ml-2 font-semibold">
                  {testRun.data.status === 'success' ? 'Success' : testRun.data.status === 'failure' ? 'Failed' : 'In Progress'}
                </span>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Date</h3>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <div className="text-base font-medium">
                    {testRun.data.run_at ? format(new Date(testRun.data.run_at), 'PPP') : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testRun.data.run_at ? format(new Date(testRun.data.run_at), 'p') : ''}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Test Results</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-semibold text-green-600">{testRun.data.passed_tests}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-red-600">{testRun.data.failed_tests}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-yellow-600">{testRun.data.skipped_tests}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Code Info</h3>
              {testRun.data.git_branch ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm truncate">{testRun.data.git_branch}</span>
                  </div>
                  <div className="flex items-center">
                    <GitCommit className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-mono truncate">
                      {testRun.data.git_commit ? testRun.data.git_commit.substring(0, 10) : 'N/A'}
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
                    All Tests ({testResults?.data?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="suites">
                    Suites ({testSuites?.data?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="failed-suites">
                    Failed Suites ({testSuites?.data?.filter(s => s.status === 'failure')?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="failed">
                    Failed Tests ({testResults?.data?.filter(r => r.status === 'failed')?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="passed">
                    Passed Tests ({testResults?.data?.filter(r => r.status === 'passed')?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="p-0 m-0">
                {(activeTab === 'suites' || activeTab === 'failed-suites') ? (
                  <div className="p-4">
                    {filteredSuites.length > 0 ? (
                      <div className="space-y-4">
                        {filteredSuites.map(suite => (
                          <TestSuiteItem 
                            key={suite.id} 
                            suite={suite} 
                            results={resultsBySuite[suite.id] || []}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No test suites found matching the selected filter.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    {filteredResults.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {Object.entries(
                          groupTestResultsBySuite(filteredResults)
                        ).map(([suite, results]: [string, any[]]) => (
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
                                    <TestResultRow key={result.id} result={result} />
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
                )}
              </TabsContent>
            </Tabs>
          </Card>
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
            onClick={() => navigate(APP_ROUTES.TEST_REPORTS)}
          >
            Back to Test Reports
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminTestRunDetail;
