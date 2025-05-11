
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Globe, RefreshCcw, RotateCw, Database, File, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

const CountryCodes = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AT', name: 'Austria' }, // Added this for easier testing
];

const LocationImporter = () => {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [minPopulation, setMinPopulation] = useState(15000);
  const [globalMinPopulation, setGlobalMinPopulation] = useState(15000);
  const [batchSize, setBatchSize] = useState(1000);
  const [maxBatches, setMaxBatches] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'global' | 'file'>('file');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [forceContinue, setForceContinue] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // File import specific settings
  const [fileMinPopulation, setFileMinPopulation] = useState(15000);
  const [fileCountry, setFileCountry] = useState<string | null>(null);
  const [fileLimit, setFileLimit] = useState(5000);
  const [fileOffset, setFileOffset] = useState(0);
  const [forceUpdateNames, setForceUpdateNames] = useState(false);
  
  const { importLocations, importLocationsFromFile, continueImport, resetImportProgress, isImporting, importProgress } = useGeoNames();
  const { user } = useAuth();

  // Calculate total imported percentage for progress bar
  const importedPercentage = importProgress?.total 
    ? Math.min(100, Math.round((importProgress.inserted + importProgress.updated) / importProgress.total * 100)) 
    : 0;

  // Reset error when changing tabs
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const handleImport = async () => {
    setError(null);
    
    if (!user) {
      setError("You must be logged in to import locations");
      return;
    }
    
    try {
      if (activeTab === 'country') {
        await importLocations({
          country: selectedCountry,
          minPopulation,
          batchSize,
          maxBatches
        });
      } else if (activeTab === 'global') {
        await importLocations({
          globalImport: true,
          minPopulation: globalMinPopulation,
          batchSize,
          maxBatches
        });
      } else if (activeTab === 'file') {
        await importLocationsFromFile({
          minPopulation: fileMinPopulation,
          country: fileCountry,
          offset: fileOffset,
          limit: fileLimit,
          forceUpdateNames,
          debugMode
        });
      }
    } catch (err) {
      setError(`Failed to import: ${err.message || 'Unknown error'}`);
    }
  };

  const handleContinueImport = async () => {
    setError(null);
    
    if (!user) {
      setError("You must be logged in to import locations");
      return;
    }
    
    try {
      await continueImport(forceContinue);
    } catch (err) {
      setError(`Failed to continue import: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Import Locations</CardTitle>
        <CardDescription>
          Import locations from GeoNames database or local file
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
              {importProgress.hasMoreData && (
                <Button 
                  onClick={handleContinueImport} 
                  disabled={isImporting} 
                  size="sm"
                  variant="secondary"
                  className="flex gap-1"
                >
                  <RotateCw className="h-4 w-4" />
                  Continue Import
                </Button>
              )}
              
              {/* Force continue option */}
              {importProgress.continuationToken && !importProgress.hasMoreData && (
                <div className="flex items-center gap-2">
                  <Switch 
                    id="force-continue" 
                    checked={forceContinue}
                    onCheckedChange={setForceContinue}
                  />
                  <Label htmlFor="force-continue" className="text-sm">Force continue</Label>
                  
                  {forceContinue && (
                    <Button 
                      onClick={handleContinueImport} 
                      disabled={isImporting} 
                      size="sm"
                      variant="outline"
                      className="flex gap-1"
                    >
                      <RotateCw className="h-4 w-4" />
                      Force Continue
                    </Button>
                  )}
                </div>
              )}
              
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
            
            {/* Debug info for continuation token */}
            {showAdvanced && importProgress.continuationToken && (
              <div className="mt-2 p-2 bg-muted rounded-md text-xs break-all">
                <div className="font-semibold mb-1">Continuation Token:</div>
                <div>{importProgress.continuationToken}</div>
              </div>
            )}
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'country' | 'global' | 'file')}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="file">
              <File className="h-4 w-4 mr-2" />
              Local File
            </TabsTrigger>
            <TabsTrigger value="country">
              <Database className="h-4 w-4 mr-2" />
              API By Country
            </TabsTrigger>
            <TabsTrigger value="global">
              <Globe className="h-4 w-4 mr-2" />
              API Global
            </TabsTrigger>
          </TabsList>
          
          {/* File import tab */}
          <TabsContent value="file" className="space-y-4">
            <Alert className="mb-4">
              <File className="h-4 w-4" />
              <AlertDescription>
                Import directly from the cities1000.txt file for faster processing and better reliability.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="file-min-population">Minimum Population</Label>
                <Input
                  id="file-min-population"
                  type="number"
                  value={fileMinPopulation}
                  onChange={(e) => setFileMinPopulation(Number(e.target.value))}
                  disabled={isImporting}
                  min={0}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file-country">Country (optional)</Label>
                <select
                  id="file-country"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={fileCountry || ""}
                  onChange={(e) => setFileCountry(e.target.value || null)}
                  disabled={isImporting}
                >
                  <option value="">All Countries</option>
                  {CountryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="file-offset">Start Offset</Label>
                  <Input
                    id="file-offset"
                    type="number"
                    value={fileOffset}
                    onChange={(e) => setFileOffset(Number(e.target.value))}
                    disabled={isImporting}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-limit">Record Limit</Label>
                  <Input
                    id="file-limit"
                    type="number"
                    value={fileLimit}
                    onChange={(e) => setFileLimit(Number(e.target.value))}
                    disabled={isImporting}
                    min={100}
                    max={20000}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="force-update-names" 
                  checked={forceUpdateNames}
                  onCheckedChange={setForceUpdateNames}
                  disabled={isImporting}
                />
                <Label htmlFor="force-update-names">Force update admin names</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="debug-mode" 
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                  disabled={isImporting}
                />
                <Label htmlFor="debug-mode" className="flex items-center gap-1">
                  <Bug className="h-4 w-4" /> 
                  Debug mode
                </Label>
              </div>
            </div>
          </TabsContent>
          
          {/* Country import tab */}
          <TabsContent value="country" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                className="w-full rounded-md border border-gray-300 p-2"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={isImporting}
              >
                {CountryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-population">Minimum Population</Label>
              <Input
                id="min-population"
                type="number"
                value={minPopulation}
                onChange={(e) => setMinPopulation(Number(e.target.value))}
                disabled={isImporting}
                min={0}
              />
            </div>
            
            <Button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              variant="ghost" 
              size="sm" 
              className="text-sm mt-2"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </Button>
            
            {showAdvanced && (
              <div className="space-y-3 border rounded-md p-3 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    disabled={isImporting}
                    min={100}
                    max={5000}
                  />
                  <p className="text-xs text-muted-foreground">Records per API call (100-5000)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-batches">Max Batches</Label>
                  <Input
                    id="max-batches"
                    type="number"
                    value={maxBatches}
                    onChange={(e) => setMaxBatches(Number(e.target.value))}
                    disabled={isImporting}
                    min={1}
                    max={20}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of batches per request (1-20)</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="global" className="space-y-4">
            <Alert className="mb-4">
              <Globe className="h-4 w-4" />
              <AlertDescription>
                Global import will retrieve cities from around the world. Consider using a higher population threshold for manageable data size.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="global-min-population">
                Minimum Population
              </Label>
              <Input
                id="global-min-population"
                type="number"
                value={globalMinPopulation}
                onChange={(e) => setGlobalMinPopulation(Number(e.target.value))}
                disabled={isImporting}
                min={0}
              />
            </div>
            
            <Button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              variant="ghost" 
              size="sm" 
              className="text-sm mt-2"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </Button>
            
            {showAdvanced && (
              <div className="space-y-3 border rounded-md p-3 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="global-batch-size">Batch Size</Label>
                  <Input
                    id="global-batch-size"
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    disabled={isImporting}
                    min={100}
                    max={5000}
                  />
                  <p className="text-xs text-muted-foreground">Records per API call (100-5000)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="global-max-batches">Max Batches</Label>
                  <Input
                    id="global-max-batches"
                    type="number"
                    value={maxBatches}
                    onChange={(e) => setMaxBatches(Number(e.target.value))}
                    disabled={isImporting}
                    min={1}
                    max={20}
                  />
                  <p className="text-xs text-muted-foreground">Maximum number of batches per request (1-20)</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
            activeTab === 'country' ? 'Import Country Locations' : (
              activeTab === 'global' ? 'Import Global Locations' : 'Import From File'
            )
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocationImporter;
