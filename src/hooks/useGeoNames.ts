
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ImportGeoNamesParams {
  country: string;
  maxResults?: number;
  minPopulation?: number;
}

export const useGeoNames = () => {
  const [isImporting, setIsImporting] = useState(false);

  const importLocations = async ({ country, maxResults = 1000, minPopulation = 15000 }: ImportGeoNamesParams) => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-geonames', {
        body: {
          country,
          maxResults,
          minPopulation
        }
      });
      
      if (error) {
        console.error('Error importing locations:', error);
        toast.error('Failed to import locations from GeoNames');
        return { success: false, error };
      }
      
      toast.success(`Successfully imported ${data.count} locations from GeoNames`);
      return { success: true, data };
    } catch (error) {
      console.error('Exception importing locations:', error);
      toast.error('An error occurred while importing locations');
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importLocations,
    isImporting
  };
};
