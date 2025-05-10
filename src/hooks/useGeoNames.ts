
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ImportGeoNamesParams {
  country?: string;
  maxResults?: number;
  minPopulation?: number;
  globalImport?: boolean;
}

export const useGeoNames = () => {
  const [isImporting, setIsImporting] = useState(false);

  const importLocations = async ({ 
    country, 
    maxResults = 1000, 
    minPopulation = 15000,
    globalImport = false
  }: ImportGeoNamesParams) => {
    setIsImporting(true);
    
    try {
      if (!globalImport && !country) {
        toast.error('Either country or globalImport parameter must be provided');
        return { success: false, error: 'Missing parameters' };
      }
      
      console.log('Calling import-geonames function with params:', { 
        country, 
        maxResults, 
        minPopulation,
        globalImport
      });
      
      const { data, error } = await supabase.functions.invoke('import-geonames', {
        body: {
          country,
          maxResults,
          minPopulation,
          globalImport
        }
      });
      
      if (error) {
        console.error('Error importing locations:', error);
        
        // Provide more specific error messages based on the error type
        if (error.message?.includes('JWT')) {
          toast.error('Authentication error. Please sign in again.');
        } else if (error.message?.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to import locations: ${error.message || 'Unknown error'}`);
        }
        
        return { success: false, error };
      }
      
      if (!data || !data.count) {
        const source = globalImport ? 'globally' : `for ${country}`;
        toast.info(`No locations found ${source} with population >= ${minPopulation}`);
        return { success: true, data: { count: 0 } };
      }
      
      toast.success(`Successfully imported ${data.count} locations from GeoNames`);
      return { success: true, data };
    } catch (error) {
      console.error('Exception importing locations:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
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
