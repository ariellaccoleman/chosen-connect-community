
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
];

const LocationImporter = () => {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [minPopulation, setMinPopulation] = useState(15000);
  const [globalMinPopulation, setGlobalMinPopulation] = useState(100000);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'global'>('country');
  const { importLocations, isImporting } = useGeoNames();
  const { user } = useAuth();

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
          minPopulation
        });
      } else {
        await importLocations({
          globalImport: true,
          minPopulation: globalMinPopulation
        });
      }
    } catch (err) {
      setError(`Failed to import: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Import Locations</CardTitle>
        <CardDescription>
          Import locations from GeoNames database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'country' | 'global')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="country">By Country</TabsTrigger>
            <TabsTrigger value="global">Global Import</TabsTrigger>
          </TabsList>
          
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
          </TabsContent>
          
          <TabsContent value="global" className="space-y-4">
            <Alert className="mb-4">
              <Globe className="h-4 w-4" />
              <AlertDescription>
                Global import will retrieve cities from around the world. Consider using a higher population threshold to limit the amount of data.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="global-min-population">
                Minimum Population (recommended: 100,000+)
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
            activeTab === 'country' ? 'Import Country Locations' : 'Import Global Locations'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocationImporter;
