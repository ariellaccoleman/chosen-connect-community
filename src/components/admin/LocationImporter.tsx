
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
import { Loader2 } from 'lucide-react';

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
  const { importLocations, isImporting } = useGeoNames();

  const handleImport = async () => {
    await importLocations({
      country: selectedCountry,
      minPopulation
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Import Locations</CardTitle>
        <CardDescription>
          Import locations from GeoNames for a specific country
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            className="w-full rounded-md border border-gray-300 p-2"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
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
          />
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
