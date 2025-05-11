
import { useState } from 'react';
import { useGeoNames } from '@/hooks/useGeoNames';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, RefreshCcw, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/utils/logger';

const LocationImporter = () => {
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  const { importLocationsFromFile, resetImportProgress, isImporting, importProgress } = useGeoNames();
  const { user } = useAuth();

  // Update logger debug mode when the toggle changes
  const handleDebugModeChange = (checked: boolean) => {
    setDebugMode(checked);
    logger.setDebugEnabled(checked);
  };

  // Calculate total imported percentage for progress bar
  const importedPercentage = importProgress?.total && importProgress.total > 0
    ? Math.min(100, Math.round((importProgress.inserted + importProgress.updated) / importProgress.total * 100)) 
    : 0;

  const handleImport = async () => {
    setError(null);
    
    if (!user) {
      setError("You must be logged in to import locations");
      return;
    }
    
    try {
      await importLocationsFromFile({
        debugMode
      });
    } catch (err) {
      setError(`Failed to import: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Location Importer</CardTitle>
        <CardDescription>
          Import locations from cities1000.txt file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {importProgress && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>Import Progress</span>
              <span>{importedPercentage}%</span>
            </div>
            <Progress value={importedPercentage} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Inserted: <span className="font-medium">{importProgress.inserted}</span></div>
              <div>Updated: <span className="font-medium">{importProgress.updated}</span></div>
              <div>Skipped: <span className="font-medium">{importProgress.skipped}</span></div>
              <div>Total: <span className="font-medium">{importProgress.total}</span></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                onClick={resetImportProgress} 
                variant="outline" 
                size="sm"
                className="flex gap-1"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id="debug-mode" 
            checked={debugMode}
            onCheckedChange={handleDebugModeChange}
            disabled={isImporting}
          />
          <Label htmlFor="debug-mode" className="flex items-center gap-1">
            <Bug className="h-4 w-4" /> 
            Debug mode
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Locations'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocationImporter;
