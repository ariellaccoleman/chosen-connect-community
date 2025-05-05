
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
];

export const ImportLocations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("");
  const [minPopulation, setMinPopulation] = useState("15000");
  const [maxResults, setMaxResults] = useState("1000");

  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to import locations",
        variant: "destructive",
      });
      return;
    }

    if (!country) {
      toast({
        title: "Country required",
        description: "Please select a country to import locations from",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: token } = await supabase.auth.getSession();
      
      const response = await fetch(
        "https://nvaqqkffmfuxdnwnqhxo.supabase.co/functions/v1/import-geonames",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.session?.access_token}`,
          },
          body: JSON.stringify({
            country,
            minPopulation: parseInt(minPopulation, 10),
            maxResults: parseInt(maxResults, 10),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import successful",
          description: `Imported ${result.count} locations from GeoNames`,
        });
      } else {
        toast({
          title: "Import failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing locations:", error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Import Locations</CardTitle>
        <CardDescription>
          Import cities from GeoNames to populate your locations database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minPopulation">Minimum Population</Label>
          <Input
            id="minPopulation"
            type="number"
            value={minPopulation}
            onChange={(e) => setMinPopulation(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only import cities with at least this many people
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxResults">Maximum Results</Label>
          <Input
            id="maxResults"
            type="number"
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of cities to import per request
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={loading || !country}
          className="w-full"
        >
          {loading ? "Importing..." : "Import Locations"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportLocations;
