
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateTestData } from "@/utils/testData";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const TestDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    organizations: any[];
  } | null>(null);
  const { user } = useAuth();

  // Only allow access if the user is authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleGenerateData = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTestData();
      setResults(result);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Data Generator</CardTitle>
          <CardDescription>
            Generate test data for development and testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6" variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will create 15 test users and 15 test organizations in the database.
              Only use this in development environments, not in production.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleGenerateData} 
            disabled={isGenerating}
            className="bg-chosen-blue hover:bg-chosen-navy"
          >
            {isGenerating ? "Generating..." : "Generate Test Data"}
          </Button>

          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Generation Results:</h3>
              <p>Created {results.users.length} users</p>
              <p>Created {results.organizations.length} organizations</p>
              <p className="mt-4">
                Check your Supabase dashboard or the application to see the generated data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDataGenerator;
